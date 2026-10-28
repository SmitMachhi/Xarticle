import { APP_NAME } from '../constants/uiContent'

export const TopBar = () => {
  return <header className="pt-6 text-center text-sm font-semibold tracking-tight print:hidden">{APP_NAME}</header>
}
