import { Box, Grid, Skeleton } from '@mui/material'

export default function DashboardSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="25%" height={40} sx={{ mb: 3 }} />
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1, mx: 'auto' }} />
              <Skeleton variant="text" width="60%" sx={{ mb: 0.5, textAlign: 'center' }} />
              <Skeleton variant="text" width="40%" sx={{ textAlign: 'center' }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
