import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { AssignmentLate, Book, Group, LocalLibrary, Payments, Receipt, Schedule } from "@mui/icons-material";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const { stats, failed } = useDashboard();

  if (failed) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <Typography color="text.secondary">Não foi possível carregar os dados.</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Visão Geral" />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Obras no catálogo" value={stats.totalWorks} icon={<LocalLibrary />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Exemplares totais" value={stats.totalItems} icon={<Book />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Exemplares disponíveis" value={stats.availableItems} icon={<Book />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Locatários ativos" value={stats.activePatrons} icon={<Group />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Empréstimos ativos" value={stats.activeLoans} icon={<AssignmentLate />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Empréstimos atrasados" value={stats.overdueLoans} icon={<AssignmentLate />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Reservas prontas" value={stats.readyHolds} icon={<Schedule />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Multas pendentes" value={stats.pendingFines} icon={<Receipt />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Saldo total de multas" value={stats.totalFineBalance} icon={<Payments />} color="secondary" isCurrency />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Filiais" value={stats.totalLibraries} icon={<LocalLibrary />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Itens em trânsito" value={stats.inTransitItems} icon={<Schedule />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Itens em reparo" value={stats.inRepairItems} icon={<Book />} color="primary" />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Placeholder para relatórios avançados (BE-023)</Typography>
        <Typography variant="body1" color="text.secondary">
          Futuras implementações: relatórios de circulação, multas por perfil, obras mais emprestadas, 
          taxa de ocupação das filiais, exportação CSV/PDF.
        </Typography>
      </Box>
    </Box>
  );
}