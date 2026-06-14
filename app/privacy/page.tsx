export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f]">
      <nav className="h-14 border-b border-white/[0.05] flex items-center px-6 sticky top-0 bg-[#0d0d0f]/95 backdrop-blur-md z-10">
        <a href="/" className="font-mono text-lg font-medium tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-2">Última actualización: junio 2026</p>
        <h1 className="text-3xl font-medium text-[#F8F7F4] mb-10">Política de Privacidad</h1>

        <div className="space-y-8 text-[#9BA0AD] leading-relaxed">

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">1. Quién somos</h2>
            <p>demo. es un servicio operado por Jaime B., con sede en Madrid, España. Puedes contactarnos en <a href="mailto:hola@demospain.app" className="text-[#7C6FFF] hover:underline">hola@demospain.app</a>.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">2. Qué datos recogemos</h2>
            <p className="mb-3">Recogemos únicamente los datos necesarios para prestarte el servicio:</p>
            <ul className="space-y-2 list-none">
              {[
                'Dirección de correo electrónico y nombre, proporcionados al registrarte con Google.',
                'Nombre de usuario y foto de perfil que eliges en la app.',
                'Archivos de audio que subes a la plataforma.',
                'Datos de uso: qué proyectos creas, qué canciones subes y cuándo.',
                'Registros técnicos: dirección IP, tipo de navegador y dispositivo.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">3. Para qué usamos tus datos</h2>
            <ul className="space-y-2 list-none">
              {[
                'Prestarte el servicio: crear tu cuenta, almacenar tus proyectos y permitir que los compartas.',
                'Enviarte notificaciones relacionadas con tu actividad en la plataforma.',
                'Mejorar y depurar el servicio.',
                'Cumplir con obligaciones legales.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">4. Con quién compartimos tus datos</h2>
            <p className="mb-3">No vendemos ni cedemos tus datos a terceros. Utilizamos los siguientes proveedores de confianza:</p>
            <ul className="space-y-2 list-none">
              {[
                'Supabase — base de datos y autenticación, alojados en la UE.',
                'Cloudflare R2 — almacenamiento de archivos de audio.',
                'Vercel — alojamiento de la aplicación web.',
                'Google — autenticación OAuth.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">5. Tus derechos</h2>
            <p className="mb-3">De acuerdo con el RGPD, tienes derecho a:</p>
            <ul className="space-y-2 list-none">
              {[
                'Acceder a los datos que tenemos sobre ti.',
                'Rectificar datos incorrectos.',
                'Solicitar la eliminación de tu cuenta y todos tus datos.',
                'Oponerte al tratamiento de tus datos.',
                'Presentar una reclamación ante la AEPD (aepd.es).',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:hola@demospain.app" className="text-[#7C6FFF] hover:underline">hola@demospain.app</a>.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">6. Cuánto tiempo guardamos tus datos</h2>
            <p>Guardamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, borramos tus datos en un plazo máximo de 30 días, salvo obligación legal de conservarlos.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">7. Cookies</h2>
            <p>Usamos únicamente cookies técnicas necesarias para el funcionamiento del servicio (sesión de usuario). No usamos cookies de publicidad ni de seguimiento de terceros.</p>
          </section>

        </div>
      </main>
    </div>
  )
}
