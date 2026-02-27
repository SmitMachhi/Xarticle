import { FAQ_ITEMS, HOW_IT_WORKS } from '../constants/uiContent'

export const InfoSection = () => {
  return (
    <section className="info-grid">
      <article className="app-card info-card" id="faq">
        <h2>FAQ</h2>
        <div className="faq-list">{FAQ_ITEMS.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </article>
      <article className="app-card info-card" id="how-it-works">
        <h2>How it works</h2>
        <ul className="how-list">{HOW_IT_WORKS.map((step) => <li key={step}>{step}</li>)}</ul>
      </article>
    </section>
  )
}
