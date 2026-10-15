import { useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { AutoStories } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { Navigate } from "react-router-dom";
import { isAuthenticated, useAuth } from "../context/AuthContext";
import { useError } from "../context/ErrorContext";

export default function Login() {
  const { login } = useAuth();
  const { notifyError } = useError();
  const [loginValue, setLoginValue] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginValue, senha);
    } catch (err) {
      notifyError(err);
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 400,
          maxWidth: "100%",
          p: 4,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              color: "primary.main",
              mb: 2,
            }}
          >
            <AutoStories fontSize="large" />
          </Box>
          <Typography variant="h5" align="center" sx={{ fontWeight: 700 }}>
            Biblioteca Escolar
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            EE.E.P. Pe. João Bosco de Lima
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Login (CPF)"
            fullWidth
            required
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.25 }}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 3 }} color="text.secondary">
          Admin padrão: 000.000.000-00 / admin
        </Typography>
      </Paper>
    </Box>
  );
}
