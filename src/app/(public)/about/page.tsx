"use client";

import { useLanguage } from "@/providers/app-providers";
import type { LanguageCode } from "@/languages";

type AboutCopy = {
  title: string;
  introTitle: string;
  intro: string;
  offerTitle: string;
  offerIntro: string;
  offerItems: string[];
  trustTitle: string;
  trust: string;
  noPromiseTitle: string;
  noPromise: string;
  goalTitle: string;
  goal: string;
  principle: string;
  howTitle: string;
  how: string;
};

const aboutCopy = {
  ar: {
    title: "من نحن", introTitle: "فرص — منصة فرص الربح الموثوقة", intro: "نحن في فرص نعمل على جمع فرص العمل والربح عبر الإنترنت في مكان واحد، وترتيبها وتصنيفها بطريقة تساعدك على الوصول إلى الفرصة المناسبة بشكل أسرع وأسهل. نؤمن أن العثور على فرصة جيدة لا يجب أن يكون رحلة طويلة بين عشرات المواقع والروابط. لذلك نسعى إلى تقديم معلومات واضحة ومنظمة عن كل فرصة، مع مراجعة المعلومات الأساسية قبل نشرها قدر الإمكان.", offerTitle: "ماذا نقدم؟", offerIntro: "نساعدك على اكتشاف فرص متنوعة في مجالات مختلفة، مع عرض أهم المعلومات التي تحتاجها لاتخاذ قرارك، مثل:", offerItems: ["نوع الفرصة", "طريقة تحقيق الدخل", "الدول المتاحة", "الأجهزة المطلوبة", "طرق الدفع", "المتطلبات", "مستوى الخبرة والمدة عند توفرها", "معلومات الموثوقية وآخر مراجعة"], trustTitle: "الثقة أولًا", trust: "هدفنا ليس عرض أكبر عدد ممكن من الفرص، بل تقديم فرص بمعلومات واضحة وموثوقة قدر الإمكان. نراجع المعلومات الأساسية المتعلقة بالفرصة قبل نشرها، ونتيح للمستخدمين الإبلاغ عن المشكلات مثل الروابط غير العاملة، انتهاء الفرصة، المعلومات غير الصحيحة أو مشاكل الدفع، لتتم مراجعتها.", noPromiseTitle: "نحن لا نعدك بالربح", noPromise: "فرص لا تضمن لك تحقيق دخل أو أرباحًا محددة. النتائج تختلف من فرصة إلى أخرى ومن شخص إلى آخر، وقد تتغير شروط الفرص أو الدول المتاحة أو طرق الدفع. لذلك نحرص على عرض المعلومات كما هي دون تقديم أرقام تسويقية أو وعود غير مؤكدة.", goalTitle: "هدفنا", goal: "أن تكون فرص بوابة موثوقة تساعدك على اكتشاف فرص العمل والربح عبر الإنترنت بسرعة وبساطة، بدل أن تكون مجرد دليل للروابط.", principle: "الثقة أولًا، السرعة ثانيًا، والبساطة ثالثًا.", howTitle: "كيف تعمل المنصة؟", how: "نحن لا ندفع للمستخدمين ولا ننفذ المهام داخل المنصة. دورنا هو تعريفك بالفرصة وتوفير المعلومات عنها، ثم يمكنك الانتقال إلى الجهة التي تقدمها والبدء من هناك.",
  },
  en: {
    title: "About us", introTitle: "Opportunity Gateway — trusted earning opportunities", intro: "Opportunity Gateway brings online work and earning opportunities together in one place, organized and categorized so you can find the right opportunity faster and more easily. We believe finding a good opportunity should not mean searching through dozens of websites and links. We provide clear, organized information for each opportunity and review key details before publishing whenever possible.", offerTitle: "What we offer", offerIntro: "We help you discover opportunities across different fields and highlight the information you need to make an informed decision, including:", offerItems: ["Opportunity type", "How income is generated", "Available countries", "Required devices", "Payment methods", "Requirements", "Experience level and duration when available", "Reliability information and latest review"], trustTitle: "Trust first", trust: "Our goal is not to list the largest possible number of opportunities, but to present opportunities with information that is as clear and reliable as possible. We review key details before publishing and let users report broken links, expired opportunities, inaccurate information, or payment issues for review.", noPromiseTitle: "We do not promise earnings", noPromise: "Opportunity Gateway does not guarantee income or specific profits. Results vary between opportunities and people, and terms, available countries, or payment methods may change. We present information as it is, without marketing figures or uncertain promises.", goalTitle: "Our goal", goal: "To be a trusted gateway that helps you discover online work and earning opportunities quickly and simply, rather than just a directory of links.", principle: "Trust first, speed second, simplicity third.", howTitle: "How does the platform work?", how: "We do not pay users or perform tasks inside the platform. Our role is to introduce you to an opportunity and provide information about it. You can then visit the provider and get started there.",
  },
  es: {
    title: "Sobre nosotros", introTitle: "Portal de Oportunidades — oportunidades confiables", intro: "En Portal de Oportunidades reunimos oportunidades de trabajo e ingresos en línea en un solo lugar, organizadas y clasificadas para ayudarte a encontrar la adecuada de forma rápida y sencilla. Ofrecemos información clara y ordenada sobre cada oportunidad y revisamos los datos principales antes de publicarla siempre que es posible.", offerTitle: "Qué ofrecemos", offerIntro: "Te ayudamos a descubrir oportunidades en distintos campos y mostramos la información necesaria para decidir:", offerItems: ["Tipo de oportunidad", "Forma de generar ingresos", "Países disponibles", "Dispositivos necesarios", "Métodos de pago", "Requisitos", "Experiencia y duración cuando están disponibles", "Información de confianza y última revisión"], trustTitle: "La confianza es lo primero", trust: "Nuestro objetivo no es mostrar la mayor cantidad de oportunidades, sino ofrecer información clara y confiable. Revisamos los datos principales y permitimos informar sobre enlaces rotos, oportunidades vencidas, información incorrecta o problemas de pago.", noPromiseTitle: "No prometemos ganancias", noPromise: "Portal de Oportunidades no garantiza ingresos ni beneficios concretos. Los resultados varían y las condiciones, países o métodos de pago pueden cambiar. Mostramos la información tal como es, sin cifras publicitarias ni promesas inciertas.", goalTitle: "Nuestro objetivo", goal: "Ser un portal confiable que te ayude a descubrir oportunidades de trabajo e ingresos en línea de forma rápida y sencilla.", principle: "Confianza primero, rapidez después y sencillez siempre.", howTitle: "Cómo funciona la plataforma", how: "No pagamos a los usuarios ni realizamos tareas dentro de la plataforma. Te presentamos la oportunidad y su información; después puedes visitar al proveedor y comenzar allí.",
  },
  fr: {
    title: "À propos de nous", introTitle: "Portail des opportunités — des opportunités fiables", intro: "Nous réunissons les opportunités de travail et de revenus en ligne au même endroit, organisées et classées pour vous aider à trouver la bonne opportunité plus rapidement et simplement. Nous fournissons des informations claires et structurées et vérifions les détails essentiels avant publication lorsque cela est possible.", offerTitle: "Ce que nous proposons", offerIntro: "Nous vous aidons à découvrir des opportunités dans différents domaines et présentons les informations utiles pour décider:", offerItems: ["Type d'opportunité", "Mode de rémunération", "Pays disponibles", "Appareils nécessaires", "Modes de paiement", "Conditions requises", "Expérience et durée lorsqu'elles sont disponibles", "Fiabilité et dernière vérification"], trustTitle: "La confiance d'abord", trust: "Notre objectif n'est pas d'afficher le plus grand nombre d'opportunités, mais de fournir des informations aussi claires et fiables que possible. Vous pouvez signaler les liens cassés, les opportunités expirées, les informations incorrectes ou les problèmes de paiement.", noPromiseTitle: "Nous ne promettons pas de revenus", noPromise: "Le Portail des opportunités ne garantit aucun revenu ni bénéfice précis. Les résultats varient et les conditions, pays ou modes de paiement peuvent changer. Nous présentons les informations telles quelles, sans chiffres marketing ni promesses incertaines.", goalTitle: "Notre objectif", goal: "Être un portail fiable qui vous aide à découvrir rapidement et simplement des opportunités de travail et de revenus en ligne.", principle: "La confiance d'abord, la rapidité ensuite, la simplicité toujours.", howTitle: "Comment fonctionne la plateforme?", how: "Nous ne payons pas les utilisateurs et n'exécutons pas de tâches sur la plateforme. Nous vous présentons l'opportunité et ses informations, puis vous pouvez visiter son fournisseur et commencer.",
  },
  de: {
    title: "Über uns", introTitle: "Chancenportal — vertrauenswürdige Chancen", intro: "Wir sammeln Online-Arbeits- und Verdienstmöglichkeiten an einem Ort und ordnen sie, damit Sie schneller und einfacher die passende Chance finden. Wir stellen klare, strukturierte Informationen bereit und prüfen wichtige Angaben vor der Veröffentlichung, soweit dies möglich ist.", offerTitle: "Was wir anbieten", offerIntro: "Wir helfen Ihnen, Chancen aus verschiedenen Bereichen zu entdecken, und zeigen wichtige Informationen wie:", offerItems: ["Art der Chance", "Methode der Einkommensgenerierung", "Verfügbare Länder", "Benötigte Geräte", "Zahlungsmethoden", "Voraussetzungen", "Erfahrung und Dauer, sofern verfügbar", "Zuverlässigkeit und letzte Prüfung"], trustTitle: "Vertrauen zuerst", trust: "Unser Ziel ist nicht die größtmögliche Anzahl an Einträgen, sondern möglichst klare und zuverlässige Informationen. Sie können defekte Links, abgelaufene Chancen, falsche Angaben oder Zahlungsprobleme melden.", noPromiseTitle: "Wir versprechen keinen Verdienst", noPromise: "Das Chancenportal garantiert kein Einkommen und keine bestimmten Gewinne. Ergebnisse unterscheiden sich, und Bedingungen, Länder oder Zahlungsmethoden können sich ändern. Wir zeigen Informationen ohne Marketingzahlen oder unsichere Versprechen.", goalTitle: "Unser Ziel", goal: "Ein zuverlässiges Portal zu sein, das Ihnen hilft, Online-Arbeits- und Verdienstmöglichkeiten schnell und einfach zu entdecken.", principle: "Vertrauen zuerst, Geschwindigkeit danach, Einfachheit an dritter Stelle.", howTitle: "Wie funktioniert die Plattform?", how: "Wir bezahlen Nutzer nicht und erledigen keine Aufgaben innerhalb der Plattform. Wir stellen die Chance und ihre Informationen vor; anschließend können Sie den Anbieter besuchen und dort beginnen.",
  },
  pt: {
    title: "Sobre nós", introTitle: "Portal de Oportunidades — oportunidades confiáveis", intro: "Reunimos oportunidades de trabalho e renda online em um só lugar, organizadas e classificadas para ajudar você a encontrar a oportunidade certa com mais rapidez e facilidade. Oferecemos informações claras e organizadas e analisamos os dados principais antes da publicação sempre que possível.", offerTitle: "O que oferecemos", offerIntro: "Ajudamos você a descobrir oportunidades em diferentes áreas e mostramos informações importantes, como:", offerItems: ["Tipo de oportunidade", "Como gerar renda", "Países disponíveis", "Dispositivos necessários", "Métodos de pagamento", "Requisitos", "Experiência e duração quando disponíveis", "Informações de confiança e última revisão"], trustTitle: "Confiança em primeiro lugar", trust: "Nosso objetivo não é listar o maior número de oportunidades, mas apresentar informações claras e confiáveis. Você pode relatar links quebrados, oportunidades encerradas, informações incorretas ou problemas de pagamento.", noPromiseTitle: "Não prometemos ganhos", noPromise: "O Portal de Oportunidades não garante renda nem lucros específicos. Os resultados variam e as condições, países ou métodos de pagamento podem mudar. Apresentamos as informações como são, sem números de marketing ou promessas incertas.", goalTitle: "Nosso objetivo", goal: "Ser um portal confiável que ajude você a descobrir oportunidades de trabalho e renda online de forma rápida e simples.", principle: "Confiança primeiro, rapidez depois e simplicidade sempre.", howTitle: "Como a plataforma funciona?", how: "Não pagamos usuários nem realizamos tarefas dentro da plataforma. Apresentamos a oportunidade e suas informações; depois você pode visitar o fornecedor e começar por lá.",
  },
  ja: {
    title: "私たちについて", introTitle: "機会のポータル — 信頼できる機会", intro: "オンラインの仕事や収入の機会を一か所に集め、整理・分類することで、適した機会をより早く簡単に見つけられるようにしています。各機会の情報を分かりやすく整理し、可能な限り公開前に基本情報を確認します。", offerTitle: "提供するもの", offerIntro: "さまざまな分野の機会を見つけ、判断に必要な情報を確認できます。", offerItems: ["機会の種類", "収入を得る方法", "利用可能な国", "必要な端末", "支払い方法", "要件", "利用可能な経験レベルと期間", "信頼性情報と最終確認"], trustTitle: "信頼を第一に", trust: "数を増やすことではなく、できる限り明確で信頼できる情報を提供することを目指しています。リンク切れ、終了した機会、不正確な情報、支払いの問題を報告して確認できます。", noPromiseTitle: "収入を保証するものではありません", noPromise: "このポータルは収入や特定の利益を保証しません。結果は人や機会によって異なり、条件、対象国、支払い方法も変わる場合があります。広告的な数字や不確かな約束はせず、情報をそのまま表示します。", goalTitle: "目標", goal: "オンラインの仕事や収入の機会を、リンク集ではなく、信頼できる形で素早く簡単に見つけられるポータルになることです。", principle: "信頼を第一に、速さを第二に、シンプルさを第三に。", howTitle: "プラットフォームの仕組み", how: "ユーザーへの支払いや、プラットフォーム内での作業は行いません。機会とその情報を紹介し、提供元のサイトへ移動して開始できるようにします。",
  },
  zh: {
    title: "关于我们", introTitle: "机会门户 — 可信的赚钱机会", intro: "我们将在线工作和赚钱机会集中在一个平台中，并进行整理和分类，帮助你更快、更轻松地找到合适的机会。我们为每个机会提供清晰、有条理的信息，并在可能的情况下发布前核实基本信息。", offerTitle: "我们提供什么", offerIntro: "我们帮助你发现不同领域的机会，并展示做出判断所需的重要信息：", offerItems: ["机会类型", "收入方式", "可用国家", "所需设备", "支付方式", "要求", "可用时的经验等级和期限", "可信度信息和最近审核"], trustTitle: "信任优先", trust: "我们的目标不是展示最多的机会，而是尽可能提供清晰、可靠的信息。你可以举报失效链接、已结束的机会、错误信息或支付问题，以便进一步审核。", noPromiseTitle: "我们不承诺收益", noPromise: "机会门户不保证收入或特定利润。结果因机会和个人而异，条件、可用国家或支付方式也可能发生变化。我们如实展示信息，不提供营销数字或未经证实的承诺。", goalTitle: "我们的目标", goal: "成为一个可信的门户，帮助你快速、简单地发现在线工作和赚钱机会，而不只是一个链接目录。", principle: "信任第一，速度第二，简单第三。", howTitle: "平台如何运作", how: "我们不会向用户付款，也不会在平台内执行任务。我们的作用是介绍机会并提供相关信息，之后你可以前往提供方并在那里开始。",
  },
} satisfies Record<LanguageCode, AboutCopy>;

export default function AboutPage() {
  const { dir, language } = useLanguage();
  const copy = aboutCopy[language];

  return (
    <main dir={dir} className="mx-auto w-full max-w-4xl px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-zinc-900">{copy.title}</h1>
        <div className="mt-8 space-y-8 text-base leading-8 text-zinc-600">
          <section>
            <h2 className="text-xl font-bold text-zinc-900">{copy.introTitle}</h2>
            <p className="mt-3">{copy.intro}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-zinc-900">{copy.offerTitle}</h2>
            <p className="mt-3">{copy.offerIntro}</p>
            <ul className="mt-3 list-disc space-y-1 ps-6">
              {copy.offerItems.map((item) => <li key={item}>{item}.</li>)}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-zinc-900">{copy.trustTitle}</h2>
            <p className="mt-3">{copy.trust}</p>
          </section>
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-xl font-bold text-amber-950">{copy.noPromiseTitle}</h2>
            <p className="mt-3 text-amber-900">{copy.noPromise}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-zinc-900">{copy.goalTitle}</h2>
            <p className="mt-3">{copy.goal}</p>
            <p className="mt-3 font-bold text-[#2563eb]">{copy.principle}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-zinc-900">{copy.howTitle}</h2>
            <p className="mt-3">{copy.how}</p>
          </section>
        </div>
      </section>
    </main>
  );
}
