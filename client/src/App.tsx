import { Provider } from 'react-redux'
import { store } from './store'
import { ConfigProvider } from 'antd'
import AppRouter from './router'
import viVN from 'antd/locale/vi_VN';
function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={viVN}>
        <AppRouter />
      </ConfigProvider>
    </Provider>
  )
}

export default App