import { FAQ_ITEMS } from '../constants/uiContent'

export const InfoSection = () => {
  return (
    <section aria-label="FAQ" className="faq" id="faq">
      {FAQ_ITEMS.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
    </section>
  )
}
