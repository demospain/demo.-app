export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f]">
      <nav className="h-14 border-b border-white/[0.05] flex items-center px-6 sticky top-0 bg-[#0d0d0f]/95 backdrop-blur-md z-10">
        <a href="/" className="font-mono text-lg font-medium tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-2">Última actualización: junio 2026</p>
        <h1 className="text-3xl font-medium text-[#F8F7F4] mb-10">Política de Cookies</h1>

        <div className="space-y-8 text-[#9BA0AD] leading-relaxed">

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">Qué son las cookies</h2>
            <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde información sobre tu visita.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">Qué cookies usamos</h2>
            <p className="mb-4">demo. usa exclusivamente cookies técnicas estrictamente necesarias:</p>
            <div className="bg-[#13141a] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-3 border-b border-white/[0.06]">
                <span className="text-xs font-mono text-[#555966] uppercase tracking-wider">Cookie</span>
                <span className="text-xs font-mono text-[#555966] uppercase tracking-wider">Propósito</span>
                <span className="text-xs font-mono text-[#555966] uppercase tracking-wider">Duración</span>
              </div>
              {[
                ['sb-auth-token', 'Mantiene tu sesión iniciada', '7 días'],
                ['sb-refresh-token', 'Renueva tu sesión automáticamente', '30 días'],
              ].map(([name, purpose, duration], i) => (
                <div key={i} className="grid grid-cols-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs font-mono text-[#7C6FFF]">{name}</span>
                  <span className="text-sm text-[#9BA0AD]">{purpose}</span>
                  <span className="text-sm text-[#555966]">{duration}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">Lo que no hacemos</h2>
            <ul className="space-y-2 list-none">
              {[
                'No usamos cookies de publicidad.',
                'No usamos cookies de seguimiento de terceros.',
                'No compartimos datos de cookies con anunciantes.',
                'No usamos Google Analytics ni herramientas de análisis de comportamiento.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">Cómo gestionar las cookies</h2>
            <p>Puedes eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que si eliminas las cookies de sesión, tendrás que volver a iniciar sesión.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">Contacto</h2>
            <p>Para cualquier consulta: <a href="mailto:hola@demospain.app" className="text-[#7C6FFF] hover:underline">hola@demospain.app</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
