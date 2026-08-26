import LoginGuruClient from './LoginGuruClient'

export const metadata = {
  title: 'Login Guru & Admin | E-Learning MTsN 1 Pacitan',
}

export default function LoginGuruPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <LoginGuruClient />
    </div>
  )
}
