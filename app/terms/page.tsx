export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f]">
      <nav className="h-14 border-b border-white/[0.05] flex items-center px-6 sticky top-0 bg-[#0d0d0f]/95 backdrop-blur-md z-10">
        <a href="/" className="font-mono text-lg font-medium tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-2">Última actualización: junio 2026</p>
        <h1 className="text-3xl font-medium text-[#F8F7F4] mb-10">Términos de Uso</h1>

        <div className="space-y-8 text-[#9BA0AD] leading-relaxed">

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">1. Aceptación</h2>
            <p>Al usar demo. aceptas estos términos. Si no estás de acuerdo, no uses el servicio. demo. es operado por Jaime B., Madrid, España.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">2. El servicio</h2>
            <p>demo. es una plataforma para compartir música en fase de desarrollo, antes de su lanzamiento público. Permite subir, organizar y compartir proyectos musicales mediante enlaces privados.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">3. Tu cuenta</h2>
            <ul className="space-y-2 list-none">
              {[
                'Debes tener al menos 16 años para usar el servicio.',
                'Eres responsable de mantener la seguridad de tu cuenta.',
                'No puedes compartir tu cuenta con otras personas.',
                'Puedes eliminar tu cuenta en cualquier momento desde la configuración.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">4. Tu contenido</h2>
            <p className="mb-3">Conservas todos los derechos sobre la música que subes. Al subir contenido a demo., nos concedes una licencia limitada para almacenarlo y mostrarlo únicamente a las personas con quienes lo compartes.</p>
            <p>No subas contenido que no sea tuyo o para el que no tengas los derechos necesarios.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">5. Uso aceptable</h2>
            <p className="mb-3">Está prohibido:</p>
            <ul className="space-y-2 list-none">
              {[
                'Subir contenido que infrinja derechos de autor de terceros.',
                'Usar el servicio para distribuir spam o contenido malicioso.',
                'Intentar acceder a cuentas o datos de otros usuarios.',
                'Usar el servicio de forma que perjudique su funcionamiento.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7C6FFF] mt-1.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">6. Límites del plan gratuito</h2>
            <p>El plan gratuito permite subir hasta 50 canciones. Podemos modificar estos límites con previo aviso.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">7. Disponibilidad</h2>
            <p>demo. está en fase beta. Nos esforzamos por mantener el servicio disponible, pero no garantizamos disponibilidad ininterrumpida. Podemos modificar o interrumpir el servicio con previo aviso.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">8. Ley aplicable</h2>
            <p>Estos términos se rigen por la legislación española. Cualquier disputa se resolverá ante los tribunales de Madrid.</p>
          </section>

          <section>
            <h2 className="text-[#F8F7F4] font-medium text-lg mb-3">9. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos: <a href="mailto:hola@demospain.app" className="text-[#7C6FFF] hover:underline">hola@demospain.app</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
