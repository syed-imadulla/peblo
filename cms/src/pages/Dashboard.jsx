import React from 'react';
import { Link } from 'react-router-dom';
import { Film, PlaySquare, FileText, AlertTriangle, CheckCircle, Tv, Edit2, UploadCloud, ChevronDown } from 'lucide-react';

const Dashboard = () => {
  const StatCard = ({ value, title, subtitle, icon: Icon, color, bgColor }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', marginBottom: 0 }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1.2' }}>{value}</div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-900)' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
    </div>
  );

  const QuickAction = ({ title, desc, icon: Icon, color, linkTo, bgColor }) => (
    <Link to={linkTo} style={{ display: 'block', backgroundColor: bgColor, borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center', transition: 'transform 0.2s', textDecoration: 'none' }} className="hover-scale">
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontWeight: '700', color: 'var(--navy-900)', fontSize: '14px', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
    </Link>
  );

  return (
    <div>
      <style>{`
        .hover-scale:hover { transform: translateY(-2px); }
        .chart-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw 2s forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
      `}</style>
      
      {/* Top Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '24px' }}>
        <StatCard value="18" title="Total Shows" subtitle="All shows in system" icon={Tv} color="var(--purple-700)" bgColor="var(--purple-100)" />
        <StatCard value="12" title="Published Shows" subtitle="Live on catalogue" icon={CheckCircle} color="var(--green-500)" bgColor="var(--green-100)" />
        <StatCard value="6" title="Draft Shows" subtitle="Not yet published" icon={FileText} color="var(--amber-500)" bgColor="var(--amber-100)" />
        <StatCard value="7" title="Validation Issues" subtitle="Need attention" icon={AlertTriangle} color="var(--red-500)" bgColor="var(--red-100)" />
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '24px' }}>
        {/* Content Overview Chart */}
        <div className="card" style={{ gridColumn: 'span 2', padding: '32px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Content Overview</h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '6px 12px', fontSize: '13px', color: 'var(--navy-900)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              This Week <ChevronDown size={14} color="var(--text-muted)" />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                {/* Y-Axis */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'right', width: '20px' }}>
                  <span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
                </div>
                {/* Grid Lines */}
                <div style={{ position: 'absolute', left: '40px', right: 0, top: '6px', bottom: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {[1,2,3,4,5,6].map(i => <div key={i} style={{ borderBottom: '1px solid var(--border)', width: '100%' }}></div>)}
                </div>
                {/* SVG Line matching exact curve from image */}
                <svg viewBox="0 0 500 200" style={{ position: 'absolute', left: '40px', right: 0, top: 0, height: '190px', width: 'calc(100% - 40px)', overflow: 'visible' }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--purple-700)" stopOpacity="0.15"/>
                      <stop offset="100%" stopColor="var(--purple-700)" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0,140 C 20,110 50,110 80,140 C 110,170 140,80 160,80 C 190,80 220,100 240,100 C 270,100 300,90 320,80 C 350,60 380,40 400,20" fill="none" stroke="var(--purple-700)" strokeWidth="3" className="chart-line" />
                  <path d="M 0,140 C 20,110 50,110 80,140 C 110,170 140,80 160,80 C 190,80 220,100 240,100 C 270,100 300,90 320,80 C 350,60 380,40 400,20 L 400,200 L 0,200 Z" fill="url(#chartGrad)" />
                  {[
                    [0,140], [80,140], [160,80], [240,100], [320,80], [400,20]
                  ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="5" fill="var(--purple-700)" stroke="white" strokeWidth="2" />
                  ))}
                </svg>
                {/* X-Axis */}
                <div style={{ position: 'absolute', left: '40px', right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '11px', paddingRight: '20px' }}>
                  <span>21 Aug</span><span>22 Aug</span><span>23 Aug</span><span>24 Aug</span><span>25 Aug</span><span>26 Aug</span><span>27 Aug</span>
                </div>
              </div>
            </div>
            
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ color: 'var(--purple-700)' }}><Film size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Episodes</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)' }}>95</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across all shows</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ color: 'var(--blue-500)' }}><Tv size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Languages</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)' }}>2</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>English, Hindi</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ color: 'var(--green-500)' }}><FileText size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Categories</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)' }}>14</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ marginBottom: 0, padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Recent Activity</h3>
            <a href="#" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--purple-700)' }}>View All</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{color: 'var(--purple-700)', fontWeight: 'bold', fontSize: '20px'}}>+</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4' }}>New show "Raga's Forest Friends" created</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by Editor User</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>2h ago</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Edit2 size={16} color="var(--green-500)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4' }}>Episode "The Lost Kite (Hindi)" updated</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by Editor User</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>3h ago</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--amber-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={16} color="var(--amber-500)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4' }}>Validation issues found in 3 episodes</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by System</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>4h ago</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UploadCloud size={16} color="var(--blue-500)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4' }}>Catalogue published successfully</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by Admin User</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>5h ago</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} color="var(--purple-700)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4' }}>Show "Maths Magic" set to draft</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by Editor User</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>1d ago</div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '24px' }}>
        {/* Quick Actions */}
        <div className="card" style={{ gridColumn: 'span 2', padding: '32px', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px' }}>Quick Actions</h3>
          <div className="grid grid-cols-4" style={{ gap: '16px' }}>
            <QuickAction title="Create New Show" desc="Add a new show to the library" icon={Tv} color="var(--purple-700)" bgColor="var(--purple-50)" linkTo="/shows" />
            <QuickAction title="Add Episode" desc="Add a new episode to a show" icon={PlaySquare} color="var(--green-500)" bgColor="var(--green-100)" linkTo="/episodes" />
            <QuickAction title="View Validation" desc="Check issues before publishing" icon={AlertTriangle} color="var(--amber-500)" bgColor="var(--amber-100)" linkTo="/validation" />
            <QuickAction title="Publish Catalogue" desc="Publish content to viewers" icon={UploadCloud} color="var(--red-500)" bgColor="var(--red-100)" linkTo="/publish" />
          </div>
        </div>

        {/* Last Publish */}
        <div className="card" style={{ marginBottom: 0, padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Last Publish</h3>
            <span className="badge badge-success" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-500)', border: 'none' }}>Success</span>
          </div>
          
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy-900)' }}>Publish #12</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>27 Aug 2026, 05:42 PM</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={16} color="var(--purple-700)" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>18</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shows</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlaySquare size={16} color="var(--navy-700)" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>72</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Episodes</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>4</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sections</div>
              </div>
            </div>
          </div>
          
          <Link to="/publish-history" className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', backgroundColor: 'var(--purple-500)', borderRadius: '8px' }}>
            View Publish History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
