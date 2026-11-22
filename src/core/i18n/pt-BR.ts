import type { ModuleId, PaletteThemeId } from '../config/types'

interface ModuleCopy {
  label: string
  question: (name: string) => string
  description: string
  /** Areas shown as placeholders until the module's own prompt builds them. */
  sections: string[]
}

export const t = {
  common: {
    continue: 'Continuar',
    back: 'Voltar',
    yes: 'Sim',
    no: 'Não',
    skip: 'Pular',
    underConstruction: 'Em construção',
    nextStep: 'Esta área ganha vida na próxima etapa.',
    skipToContent: 'Pular para o conteúdo',
  },

  signIn: {
    title: 'Bem-vindo à ZeroX',
    sub: 'Entre para montar o sistema do seu negócio.',
    google: 'Entrar com Google',
    mockNote: 'Demonstração: o login real com Google chega junto com o banco de dados.',
  },

  onboarding: {
    counter: (n: number, total: number) => `${n}/${total}`,
    progressLabel: (n: number, total: number) => `Etapa ${n} de ${total}`,

    nameTitle: 'Como você quer ser chamado?',
    nameSub: 'É assim que a ZeroX vai falar com você.',
    nameLabel: 'Seu nome',
    namePlaceholder: 'Ex.: Mateus',
    nameError: 'Digite como você quer ser chamado.',

    themeTitle: (name: string) => `Escolha seu tema, ${name}`,
    themeSub: 'Ele muda o app inteiro. Dá para trocar depois em Configurações.',

    businessTitle: (name: string) => `Qual é o seu negócio, ${name}?`,
    businessSub: 'Assim a ZeroX se ajusta ao que você faz.',
    businessLabel: 'Tipo de negócio',
    businessPlaceholder: 'Ex.: Farmácia',
    businessError: 'Conte qual é o seu negócio.',
    businessSuggestions: ['Farmácia', 'Restaurante', 'Loja', 'Clínica', 'Oficina', 'Distribuidora'],

    dbTitle: (name: string) => `${name}, você tem um banco de dados que podemos usar?`,
    dbSub: 'Se não tiver, tudo bem: a ZeroX guarda seus dados para você.',
    dbWhich: 'Qual banco de dados?',
    dbSupabase: 'Supabase',
    dbOther: 'Outro',
    dbNote: 'A conexão é feita pela equipe ZeroX. Nenhuma senha ou chave é pedida aqui.',
    dbConnect: 'Conectar e continuar',

    moduleEyebrow: 'Partes do app',

    welcome: (name: string) => `Seja bem-vindo(a), ${name}`,
    welcomeSub: 'Preparando o seu app…',
  },

  modules: {
    dashboard: {
      label: 'Dashboard inicial',
      question: (name) => `${name}, quer um Dashboard inicial?`,
      description: '6 widgets e 1 gráfico que você monta do seu jeito, logo na entrada do app.',
      sections: [],
    },
    collaborators: {
      label: 'Colaboradores',
      question: (name) => `${name}, quer usar Colaboradores?`,
      description:
        'Sua equipe com ficha detalhada, lista de presença e a troca entre clientes, parceiros e fornecedores.',
      sections: ['Colaboradores', 'Clientes', 'Parceiros', 'Fornecedores', 'Lista de presença'],
    },
    personalFinance: {
      label: 'Finanças pessoais',
      question: (name) => `${name}, quer controlar suas Finanças pessoais?`,
      description: 'Suas contas bancárias, categorias, entradas e saídas, e contas a pagar e a receber.',
      sections: ['Contas bancárias', 'Categorias', 'Entradas e saídas', 'Títulos a pagar e a receber'],
    },
    stock: {
      label: 'Estoque',
      question: (name) => `${name}, quer usar o Estoque?`,
      description: 'Quanto você tem, quanto vendeu, quanto chegou do fornecedor e quanto o caminhão rodou.',
      sections: [],
    },
    businessFinance: {
      label: 'Finanças da empresa',
      question: (name) => `${name}, quer as Finanças da empresa?`,
      description: 'Contas, categorias, fluxo de caixa e títulos da empresa, com o pagamento dos funcionários.',
      sections: [
        'Contas bancárias',
        'Categorias',
        'Entradas e saídas',
        'Títulos a pagar e a receber',
        'Pagamento de funcionários',
      ],
    },
    mainDashboard: {
      label: 'Dashboard principal',
      question: (name) => `${name}, quer o Dashboard principal?`,
      description: 'Até 3 páginas, cada uma com 4 gráficos e até 8 widgets sobre o que você escolheu.',
      sections: [],
    },
    setAsWish: {
      label: 'Set-as-wish',
      question: (name) => `${name}, quer seções feitas sob medida?`,
      description:
        'Páginas exclusivas do seu negócio. Você pede o que precisa e a ZeroX constrói só para você.',
      sections: [],
    },
  } satisfies Record<ModuleId, ModuleCopy>,

  widget: (n: number) => `Widget ${n}`,
  chart: (n: number) => `Gráfico ${n}`,
  page: (n: number) => `Página ${n}`,

  themes: {
    dolphin: 'Azuis profundos do oceano',
    blackwidow: 'Vermelho e preto intensos',
    frog: 'Verdes da mata',
    wolf: 'Cinzas de aço',
  } satisfies Record<PaletteThemeId, string>,

  shell: {
    greeting: 'Olá,',
    navModules: 'Módulos',
    navExclusive: 'Exclusivo',
    settings: 'Configurações',
    collapse: 'Recolher menu',
    expand: 'Expandir menu',
    noModulesTitle: 'Nenhum módulo ativo',
    noModulesSub: 'Você não ativou nenhuma parte do app. Fale com a equipe ZeroX para ativar.',
    loading: 'Carregando…',
  },

  settings: {
    title: 'Configurações',
    sub: 'Tema, negócios e conta.',
    theme: 'Tema',
    businesses: 'Negócios',
    businessesSub: 'Cada negócio tem sua própria configuração e seus próprios dados.',
    active: 'Ativo',
    use: 'Usar este',
    addBusiness: 'Adicionar negócio',
    createdOn: (date: string) => `Criado em ${date}`,
    modulesCount: (n: number) => (n === 1 ? '1 módulo' : `${n} módulos`),
    account: 'Conta',
    signOut: 'Sair',
    about: 'Sobre',
    version: (base: string, client: string) => `ZeroX base ${base} · cliente ${client}`,
  },
}
