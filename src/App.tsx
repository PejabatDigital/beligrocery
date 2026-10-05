import { Route, Routes } from 'react-router-dom'
import { DataProvider } from './app/DataProvider'
import { Gate, RequireProfile, RootRedirect } from './app/guards'
import { DevComponents } from './pages/DevComponents'
import { History } from './pages/history/History'
import { ItemDetail } from './pages/history/ItemDetail'
import { OrderDetail } from './pages/history/OrderDetail'
import { Home } from './pages/home/Home'
import { LogOrder } from './pages/log/LogOrder'
import { Saved } from './pages/log/Saved'
import { Copied } from './pages/orderday/Copied'
import { Draft } from './pages/orderday/Draft'
import { SetupHowOften } from './pages/setup/SetupHowOften'
import { SetupPastOrders } from './pages/setup/SetupPastOrders'
import { SetupWho } from './pages/setup/SetupWho'
import { Welcome } from './pages/setup/Welcome'
import { Settings } from './pages/settings/Settings'

export function App() {
  return (
    <Routes>
      <Route path="/dev/components" element={<DevComponents />} />
      <Route
        path="*"
        element={
          <DataProvider>
            <Gate>
              <Routes>
                <Route index element={<RootRedirect />} />
                <Route path="welcome" element={<Welcome />} />
                <Route path="setup/who" element={<SetupWho />} />
                <Route path="setup/how-often" element={<SetupHowOften />} />
                <Route path="setup/past-orders" element={<SetupPastOrders />} />
                <Route element={<RequireProfile />}>
                  <Route path="home" element={<Home />} />
                  <Route path="log" element={<LogOrder />} />
                  <Route path="log/saved/:id" element={<Saved />} />
                  <Route path="draft" element={<Draft />} />
                  <Route path="draft/copied" element={<Copied />} />
                  <Route path="history" element={<History />} />
                  <Route path="history/orders/:id" element={<OrderDetail />} />
                  <Route path="history/items/:id" element={<ItemDetail />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </Gate>
          </DataProvider>
        }
      />
    </Routes>
  )
}
