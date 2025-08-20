'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Railway API 클라이언트를 통한 실제 서버 API 호출
      console.log('[AdminLogin] Attempting login with Railway API client');
      const { railwayApi } = await import('../../../../lib/railway-api-client');
      
      console.log('[AdminLogin] Calling railwayApi.login with:', {
        email: formData.email,
        passwordLength: formData.password.length
      });
      
      const data = await railwayApi.login(formData.email, formData.password);
      
      console.log('[AdminLogin] Login successful, received data:', {
        hasAccessToken: !!data.access_token,
        hasUser: !!data.user,
        userEmail: data.user?.email
      });

      if (data.access_token && data.user) {
        // JWT 토큰과 사용자 정보 저장
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        
        // 쿠키에도 저장 (미들웨어에서 확인)
        document.cookie = `admin_token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        
        console.log('[AdminLogin] Tokens stored, redirecting to admin dashboard');
        
        // 관리자 대시보드로 리다이렉트
        router.push('/admin');
      } else {
        console.error('[AdminLogin] Invalid response structure:', data);
        setError('로그인 응답이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('[AdminLogin] Login error:', error);
      if (error instanceof Error) {
        setError(error.message || '로그인 중 오류가 발생했습니다.');
      } else {
        setError('로그인 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">관리자 로그인</CardTitle>
            <CardDescription className="mt-2">
              Glimpse 관리자 대시보드에 접속하려면 로그인하세요
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@glimpse.app"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </div>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                테스트용 관리자 계정:
              </p>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                이메일: admin@glimpse.app<br />
                비밀번호: admin123!
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push('/')}
              className="text-xs text-muted-foreground"
            >
              ← 메인 페이지로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}