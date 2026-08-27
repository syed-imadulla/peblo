# Publish Algorithm

This document defines the exact execution logic and transaction boundaries of the `PublishService` to ensure a safe, deterministic, and atomic catalogue generation process.

## The Algorithm

The algorithm must flawlessly transform the denormalized operational data into the `CATALOGUE_CONTRACT.md` format, safely bypassing invalid data without crashing.

### Pseudocode

```python
def publish_catalogue(admin_user_id):
    # 1. start publish (Explicitly triggered by an Admin)
    # 13. Initialize PublishRun record
    run_id = DB.insert(PublishRun(status="pending", triggered_by=admin_user_id))
    
    # Explicit Transaction Boundary for read isolation
    DB.begin_transaction()
    try:
        # 2. identify published records
        # Fetch Episode JOIN Season JOIN Show JOIN Artwork
        published_records = DB.query("SELECT * FROM episodes WHERE status = 'published'")
        
        publishable_records = []
        blocked_records = []
        
        # 3. run validation
        for record in published_records:
            errors = ValidationService.validate_for_publish(record)
            
            # 4. stop if publish-blocking errors exist (for this record)
            if errors.has_blocking_errors():
                blocked_records.append(record)
                continue # Stop processing this invalid record, move to next
                
            # 5. select publishable records
            publishable_records.append(record)
            
        DB.commit_transaction() # Read lock release
    except Exception as read_error:
        DB.rollback_transaction()
        # 14. handle failure
        return fail_run(run_id, read_error)

    try:
        # 6. group language variants by content_group
        grouped_catalogue = group_by(publishable_records, "content_group")
        
        final_catalogue_structure = initialize_sections()
        
        for content_group_id, records in grouped_catalogue:
            # 7. deduplicate languages
            unique_langs = sorted(list(set(r.language for r in records)))
            
            # Use the first record as the canonical metadata source for title, duration, etc.
            canonical = records[0] 
            
            episode_json = {
                "content_group": content_group_id,
                "title": canonical.title,
                "duration_seconds": canonical.duration_seconds,
                "languages": unique_langs,
                "artwork": serialize_artwork(canonical)
            }
            
            # 8. handle Season 0
            if canonical.season_number == 0:
                final_catalogue_structure[canonical.section][canonical.show_id].trailers.append(episode_json)
            else:
                final_catalogue_structure[canonical.section][canonical.show_id].seasons[canonical.season_number].episodes.append(episode_json)
        
        # 9. generate deterministic catalogue
        sort_all_lists_and_keys(final_catalogue_structure)
        
        # 10. serialize deterministically
        catalogue_json_string = json.dumps(final_catalogue_structure, sort_keys=True)
        
        # 11. write a complete temporary catalogue
        temp_filename = f"catalogue_temp_{run_id}.json"
        Storage.write(temp_filename, catalogue_json_string)
        
        # 12. atomically switch the live catalogue
        Storage.rename(temp_filename, "catalogue_live.json")
        
        # 13. record PublishRun success
        DB.update(PublishRun(id=run_id, status="success", published=len(publishable_records), blocked=len(blocked_records)))
        
    except Exception as build_error:
        # 14. handle failure (catalogue generation, storage write, atomic replace)
        fail_run(run_id, build_error)

def fail_run(run_id, error):
    # 14. Log failure to audit table safely
    DB.update(PublishRun(id=run_id, status="failed", error_log=str(error)))
    return False
```

## Failure Scenario Handling

- **If validation fails:** For a specific record, the record is excluded (blocked). The pipeline proceeds. If validation logic itself crashes, the read transaction rolls back, `PublishRun` is marked `failed`, and the live catalogue is untouched.
- **If catalogue generation fails:** No files are written. The `PublishRun` is marked `failed`.
- **If storage write fails (temp file):** The `PublishRun` is marked `failed`. The old live catalogue remains completely safe.
- **If atomic replacement fails:** The rename operation fails, `PublishRun` is marked `failed`, the temp file is orphaned (or cleaned up), and the old `catalogue_live.json` continues serving users seamlessly.
- **If PublishRun recording fails:** This is a system-level DB error. If writing the success status fails, the file may have been swapped successfully, but the DB lacks the final status. Standard DB alerting should catch this.

## Duplicate Handling Policy

If multiple records have the same `(content_group, language)`, the conflicting language variant is blocked from publication rather than arbitrarily selecting one record. This ensures that the catalogue accurately reflects unambiguous source data, and explicitly forces content editors to resolve the conflict in the CMS.

## 15. Idempotent Repeated Publishing
Because the algorithm generates the entire catalogue structure from scratch (from canonical DB state), serializes it deterministically (sorted keys, sorted arrays), writes a completely fresh temporary file, and uses an atomic file-system replacement, running the publish job 100 times in a row without data changes will safely output the exact same JSON 100 times without duplicating arrays or corrupting state.

## Simulation Reconciliation
Running this algorithm against the Phase 0 audit confirms:
- **1. start**: DB contains `95` raw episodes.
- **2. identify**: Filters out `10` drafts. Leaves `85` published.
- **3/4/5. validation**: Blocks `ep_0036` (missing art), `ep_0004` (duplicate cg/lang), and `ep_9001` (duplicate cg/lang). This is `3` blocked. Leaves `82` publishable rows.
- **6/7/8/9. group/dedupe/Season0**: Grouping the 82 rows results in exactly `65` unique catalogue entries. Of these, `2` belong to Season 0 and are routed to the `trailers` list.
- **10/11/12. output**: Atomically writes `catalogue_live.json`.
