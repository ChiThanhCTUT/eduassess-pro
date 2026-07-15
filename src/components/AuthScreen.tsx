import React, { useState } from 'react';
import { Role } from '../types';

interface AuthScreenProps {
  onLogin: (role: Role, userName: string, studentId?: string, token?: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Login form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(async res => {
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const errText = await res.text().catch(() => '');
          throw new Error(errText || `Không thể kết nối với Express Backend (HTTP ${res.status}). Vui lòng đảm bảo bạn đã khởi động Express Server.`);
        }
        if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.');
        return data;
      })
      .then(data => {
        setLoading(false);
        onLogin(data.user.role, data.user.name, data.user.studentId, data.token);
      })
      .catch(err => {
        setLoading(false);
        setError(err.message);
      });
  };



  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex items-center justify-center p-4 md:p-8">
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-2xl min-h-[700px]">
        {/* Left Side: Branding & Welcome */}
        <section className="relative hidden md:flex flex-col justify-center p-12 overflow-hidden bg-[#0058be]">
          {/* Background Decorative Element */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
              <path d="M0 0 L100 0 L100 100 Z" fill="white"></path>
            </svg>
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[#0058be] text-3xl">school</span>
              </div>
              <h1 className="font-bold text-2xl text-white tracking-tight">EduAssess Pro</h1>
            </div>
            <div className="space-y-4">
              <h2 className="font-bold text-3xl text-white leading-tight">Làm chủ tiềm năng học thuật của bạn</h2>
              <p className="text-[#adc6ff] text-sm max-w-md leading-relaxed">
                Trải nghiệm thế hệ tiếp theo của các kỳ thi trực tuyến. An toàn, tin cậy và được thiết kế để giúp bạn tập trung vào điều quan trọng nhất — kiến thức của bạn.
              </p>
            </div>
            <div className="pt-4">
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-video border-4 border-white/10">
                <img 
                  alt="Sinh viên tập trung học tập" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC91e0ow7vKeafvggFr0AsPgZu9Ni6mylqEH4AZLWV1ZdSx4iwarbnPPFjJMtzh0HLwatn7UtFy7bNiZ9YvvTfTweVvaSS3PLnXdpMXP_OL7bpo1lMZjF7cGWV3qIuDEBMtNU2obYkCXLlEXNqK6RHod114FK6LWsjq60XQOjz_IZr5O7UXIP3Byqo-3EtwXH5VKEFxT3S4gtkuWXq9qNcvdmb_m99MeBpFbNTXYF91xin8UVr3eJX0SSqDIsuKAV1Q3UYzVixLB62n"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex flex-col">
                <span className="font-bold text-xl text-white">99.9%</span>
                <span className="text-xs text-[#adc6ff]">Độ tin cậy Uptime</span>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-white">1Tr+</span>
                <span className="text-xs text-[#adc6ff]">Kỳ thi đã tổ chức</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Auth Forms */}
        <section className="flex flex-col p-8 md:p-12 lg:p-16 justify-center">
          <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="border-b border-gray-200 mb-6">
              <span className="pb-4 text-sm font-semibold text-[#0058be] border-b-2 border-[#0058be] inline-block">
                Đăng nhập
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-red-700 text-lg">error</span>
                <span className="font-semibold text-xs">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#191c1d]">Chào mừng trở lại</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Vui lòng nhập chi tiết thông tin để truy cập bảng điều khiển.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600" htmlFor="login-email">Địa chỉ Email trường học</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-sm" 
                        id="login-email" 
                        placeholder="name@university.edu.vn" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-600" htmlFor="login-password">Mật khẩu</label>
                      <a 
                        href="#forgot" 
                        onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ với ban CNTT nhà trường để khôi phục mật khẩu.'); }}
                        className="text-xs text-[#0058be] hover:underline"
                      >
                        Quên mật khẩu?
                      </a>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                      <input 
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0058be] focus:border-transparent outline-none text-sm" 
                        id="login-password" 
                        placeholder="••••••••" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      className="w-4 h-4 rounded border-gray-300 text-[#0058be] focus:ring-[#0058be]" 
                      id="remember" 
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={loading}
                    />
                    <label className="text-xs text-gray-500 cursor-pointer" htmlFor="remember">Duy trì đăng nhập trong 30 ngày</label>
                  </div>
                  <button 
                    className="w-full py-3 bg-[#0058be] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:scale-100" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>
              </div>

            {/* Alternative Logins */}
            <div className="mt-8">
              <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hoặc tiếp tục với</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onLogin('student', 'Alex Johnson', '48291')}
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700"
                >
                  <img alt="Google" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnFPgSbXgrTRg1i2MFSHsl_lhaEsXEVPK1c26CM2cn0GoXi8OtORYLejQ-J9es_GiUuIVfk7JhJiQ2RMaviqKlfC1rVbbo9YLwZb89LNIr5nk2Y9kYhOBHPTQ4f7MOZhuU4w0P-LVrZ62VQu5QKMxrXoNj3O7nD9CNYTw4i_Lg6hkgN4sgsOVSlfxtaxLtEfKJl7H04We2agw56iXt9f2PskW-AKW5edwe-UE-lAIm3o-mdLnZek6nFjlCNyA5lTonEkIEgWo_fU_g"/>
                  Google
                </button>
                <button 
                  onClick={() => onLogin('student', 'Alex Johnson', '48291')}
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700"
                >
                  <img alt="Microsoft" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr2WiIpS8MK6msI36tUT9vCFupMJk3sTFFad8IAvTzXG5bQe2KK62wQc0dyCkfH55kZnbKTCr7T8Hz3M84dBRsA-IaZPCgjTE1lsSWfU47vi19A5fxOAXIZ03OCjwi07Y_WAcbdRCs_U2lDlrrljxgMzpDlHon7OYA_MHI6VRRtQGmXRKmR9svKVgUXWT9dHoUpfdre3kiZr9aAWyWPrjTnYn4ZSr4CT9bTxOaLkCTeM8698Llk_7keAdF3R112z5euDoe-UpyhVSA"/>
                  Microsoft
                </button>
              </div>
            </div>

            <footer className="mt-10 text-center">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Hệ thống Bảo mật © 2026 EduAssess Pro.<br/>
                Chỉ dành cho nhân sự được ủy quyền của nhà trường.
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
