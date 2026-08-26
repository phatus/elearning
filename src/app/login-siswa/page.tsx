import LoginSiswaClient from './LoginSiswaClient'

export const metadata = {
  title: 'Login Siswa | E-Learning MTsN 1 Pacitan',
}

export default function LoginSiswaPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <LoginSiswaClient />
    </div>
  )
}
