import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add,
  Assessment,
  AutoStories,
  Book,
  Business,
  Category,
  ChevronLeft,
  DarkMode,
  LightMode,
  Logout,
  Menu,
  MenuBook,
  MonitorHeart,
  Notifications as NotificationsIcon,
  Payments,
  Person,
  Settings,
  SpaceDashboard,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeMode } from '../context/ThemeModeContext'
import { useInstitution } from '../context/InstitutionContext'
import { useLibrary } from '../context/LibraryContext'

const DRAWER_WIDTH = 240
const DRAWER_MIN_WIDTH = 72

const items = [
  { to: '/', label: 'Dashboard', icon: <SpaceDashboard /> },
  { to: '/works', label: 'Catálogo (Obras)', icon: <MenuBook /> },
  { to: '/items', label: 'Exemplares', icon: <AutoStories /> },
  { to: '/patrons', label: 'Locatários', icon: <Person /> },
  { to: '/loans', label: 'Empréstimos', icon: <Book /> },
  { to: '/holds', label: 'Reservas', icon: <Category /> },
  { to: '/fines', label: 'Multas', icon: <Payments /> },
  { to: '/libraries', label: 'Filiais', icon: <Business /> },
  { to: '/profiles', label: 'Perfis', icon: <Settings /> },
  { to: '/reports', label: 'Relatórios & BI', icon: <Assessment /> },
  { to: '/notifications', label: 'Notificações', icon: <NotificationsIcon /> },
  { to: '/observability', label: 'Observabilidade', icon: <MonitorHeart /> },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { resolvedMode, toggleMode } = useThemeMode()
  const { institutions, selectedInstitution, setSelectedInstitution, userRole } = useInstitution()
  const [open, setOpen] = useState(() => {
    const saved = window.localStorage.getItem('sidebar-open')
    return saved === null ? true : saved === '1'
  })

  function toggle() {
    setOpen((o) => {
      const next = !o
      window.localStorage.setItem('sidebar-open', next ? '1' : '0')
      return next
    })
  }

  const themeToggle = (
    <Tooltip title={resolvedMode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
      <IconButton
        size="small"
        onClick={toggleMode}
        aria-label="alternar tema"
        sx={{ color: 'text.secondary', flexShrink: 0 }}
      >
        {resolvedMode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  )

  const institutionSelect = (
    <FormControl size="small" sx={{ minWidth: 200, ml: 1, flexShrink: 0 }}>
      <InputLabel id="institution-label">Instituição</InputLabel>
      <Select
        labelId="institution-label"
        value={selectedInstitution?.id ?? ''}
        label="Instituição"
        onChange={(e) => {
          const inst = institutions.find(i => i.id === e.target.value)
          if (inst) setSelectedInstitution(inst)
        }}
        displayEmpty
      >
        {institutions.map((inst) => (
          <MenuItem key={inst.id} value={inst.id}>
            {inst.name} ({inst.code}) {inst.role === 'GLOBAL_ADMIN' ? '🌐' : '🏢'}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )

  const isGlobalAdmin = userRole === 'GLOBAL_ADMIN'
  const { libraries, selectedLibrary, setSelectedLibrary } = useLibrary()

  const librarySelect = (
    <FormControl size="small" sx={{ minWidth: 180, ml: 1, flexShrink: 0 }}>
      <InputLabel id="library-label">Filial / Balcão</InputLabel>
      <Select
        labelId="library-label"
        value={selectedLibrary?.id ?? ''}
        label="Filial / Balcão"
        onChange={(e) => {
          const lib = libraries.find((l) => l.id === e.target.value)
          setSelectedLibrary(lib ?? null)
        }}
      >
        {isGlobalAdmin && (
          <MenuItem value="">
            <em>Todas as filiais (Global)</em>
          </MenuItem>
        )}
        {libraries.map((lib) => (
          <MenuItem key={lib.id} value={lib.id}>
            {lib.name} {lib.isCentral ? '(Central)' : ''}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={toggle} edge="start" aria-label="alternar menu" sx={{ color: 'text.secondary' }}>
            {open ? <ChevronLeft /> : <Menu />}
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
            Sistema Bibliotecário
          </Typography>
          {institutions.length > 0 && institutionSelect}
          {institutions.length > 0 && libraries.length > 0 && librarySelect}
          {isGlobalAdmin && (
            <NavLink to="/institutions" style={{ textDecoration: 'none' }}>
              <Tooltip title="Criar/gerenciar instituições">
                <IconButton size="small" aria-label="instituições" sx={{ color: 'primary.main', mr: 0.5 }}>
                  <Add />
                </IconButton>
              </Tooltip>
            </NavLink>
          )}
          {themeToggle}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: open ? DRAWER_WIDTH : DRAWER_MIN_WIDTH,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : DRAWER_MIN_WIDTH,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            transition: (t) =>
              t.transitions.create('width', {
                duration: t.transitions.duration.shorter,
                easing: t.transitions.easing.sharp,
              }),
          },
        }}
      >
        <Toolbar sx={{ px: open ? 2 : 0.5, justifyContent: open ? 'space-between' : 'center' }}>
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden', minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  color: 'primary.main',
                  flexShrink: 0,
                }}
              >
                <AutoStories fontSize="small" />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                Biblioteca
              </Typography>
            </Box>
          )}
          {themeToggle}
        </Toolbar>
        <Divider />

        <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
          {items.map((item) => (
            <Tooltip key={item.to} title={item.label} placement="right" disableHoverListener={open}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
                sx={{
                  mb: 0.5,
                  minHeight: 40,
                  justifyContent: open ? 'initial' : 'center',
                  px: open ? 1.5 : 1,
                  '&.active': {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                    color: 'primary.main',
                  },
                  '&.active .MuiListItemIcon-root': { color: 'primary.main' },
                  '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>

        <Divider />
        <Box sx={{ p: 1 }}>
          {open && user && (
            <Box sx={{ px: 1, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem', flexShrink: 0 }}>
                {user.nome.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {user.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {userRole === 'GLOBAL_ADMIN' ? '🌐 Admin Global' : '🏢 Admin da Instituição'}
                </Typography>
              </Box>
            </Box>
          )}
          <ListItemButton
            onClick={logout}
            sx={{
              minHeight: 40,
              justifyContent: open ? 'initial' : 'center',
              px: open ? 1.5 : 1,
              color: 'text.secondary',
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : 'auto', justifyContent: 'center', color: 'inherit' }}>
              <Logout />
            </ListItemIcon>
            {open && (
              <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
            )}
          </ListItemButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}