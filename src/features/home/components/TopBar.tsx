import { APP_NAME } from '../constants/uiContent'

export const TopBar = () => {
  return <header className="pt-6 text-center font-mono text-sm font-semibold print:hidden">{APP_NAME}</header>
}
