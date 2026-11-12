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
  useMediaQuery,
  useTheme,
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user, logout } = useAuth()
  const { resolvedMode, toggleMode } = useThemeMode()
  const { institutions, selectedInstitution, setSelectedInstitution, userRole } = useInstitution()
  const isGlobalAdmin = userRole === 'GLOBAL_ADMIN'
  const { libraries, selectedLibrary, setSelectedLibrary } = useLibrary()

  const [desktopOpen, setDesktopOpen] = useState(() => {
    const saved = window.localStorage.getItem('sidebar-open')
    return saved === null ? true : saved === '1'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggle() {
    if (isMobile) {
      setMobileOpen((o) => !o)
    } else {
      setDesktopOpen((o) => {
        const next = !o
        window.localStorage.setItem('sidebar-open', next ? '1' : '0')
        return next
      })
    }
  }

  const isExpanded = isMobile ? true : desktopOpen

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

  const renderInstitutionSelect = (fullWidth = false) => (
    <FormControl size="small" fullWidth={fullWidth} sx={{ minWidth: fullWidth ? 'auto' : 200, ml: fullWidth ? 0 : 1, flexShrink: 0 }}>
      <InputLabel id={`institution-label${fullWidth ? '-mobile' : ''}`}>Instituição</InputLabel>
      <Select
        labelId={`institution-label${fullWidth ? '-mobile' : ''}`}
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

  const renderLibrarySelect = (fullWidth = false) => (
    <FormControl size="small" fullWidth={fullWidth} sx={{ minWidth: fullWidth ? 'auto' : 180, ml: fullWidth ? 0 : 1, flexShrink: 0 }}>
      <InputLabel id={`library-label${fullWidth ? '-mobile' : ''}`}>Filial / Balcão</InputLabel>
      <Select
        labelId={`library-label${fullWidth ? '-mobile' : ''}`}
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
            {isMobile ? (mobileOpen ? <ChevronLeft /> : <Menu />) : (desktopOpen ? <ChevronLeft /> : <Menu />)}
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
            Sistema Bibliotecário
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {institutions.length > 0 && renderInstitutionSelect(false)}
            {institutions.length > 0 && libraries.length > 0 && renderLibrarySelect(false)}
            {isGlobalAdmin && (
              <NavLink to="/institutions" style={{ textDecoration: 'none' }}>
                <Tooltip title="Criar/gerenciar instituições">
                  <IconButton size="small" aria-label="instituições" sx={{ color: 'primary.main', ml: 0.5 }}>
                    <Add />
                  </IconButton>
                </Tooltip>
              </NavLink>
            )}
          </Box>

          {themeToggle}
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 0 : (desktopOpen ? DRAWER_WIDTH : DRAWER_MIN_WIDTH),
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: isMobile ? DRAWER_WIDTH : (desktopOpen ? DRAWER_WIDTH : DRAWER_MIN_WIDTH),
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
        <Toolbar sx={{ px: isExpanded ? 2 : 0.5, justifyContent: isExpanded ? 'space-between' : 'center' }}>
          {isExpanded && (
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

        {isMobile && institutions.length > 0 && (
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {renderInstitutionSelect(true)}
            {libraries.length > 0 && renderLibrarySelect(true)}
            {isGlobalAdmin && (
              <NavLink to="/institutions" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                <ListItemButton sx={{ borderRadius: 1, px: 1, py: 0.5, color: 'primary.main' }}>
                  <ListItemIcon sx={{ minWidth: 28, color: 'primary.main' }}>
                    <Add fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Instituições" primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600 }} />
                </ListItemButton>
              </NavLink>
            )}
            <Divider />
          </Box>
        )}

        <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
          {items.map((item) => (
            <Tooltip key={item.to} title={item.label} placement="right" disableHoverListener={isExpanded}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
                onClick={() => {
                  if (isMobile) setMobileOpen(false)
                }}
                sx={{
                  mb: 0.5,
                  minHeight: 40,
                  justifyContent: isExpanded ? 'initial' : 'center',
                  px: isExpanded ? 1.5 : 1,
                  '&.active': {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                    color: 'primary.main',
                  },
                  '&.active .MuiListItemIcon-root': { color: 'primary.main' },
                  '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: isExpanded ? 1.5 : 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {isExpanded && (
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
          {isExpanded && user && (
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
              justifyContent: isExpanded ? 'initial' : 'center',
              px: isExpanded ? 1.5 : 1,
              color: 'text.secondary',
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: isExpanded ? 1.5 : 'auto', justifyContent: 'center', color: 'inherit' }}>
              <Logout />
            </ListItemIcon>
            {isExpanded && (
              <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
            )}
          </ListItemButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}