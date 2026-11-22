import { PageHead } from '../../core/layout/PageHead'

export default function ExclusivePanel() {
  return (
    <>
      <PageHead
        title="Painel exclusivo"
        sub="Seção feita sob medida para este cliente. Os outros clientes da ZeroX não recebem este código."
      />
      <div className="glass card">
        <div className="well placeholder-well">Conteúdo exclusivo do cliente Demonstração.</div>
      </div>
    </>
  )
}
