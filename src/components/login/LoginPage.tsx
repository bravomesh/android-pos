import { FormEvent, useState } from "react";
import { useDispatch } from "react-redux";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { toast } from "../../toast/useToast";
import { loginUser } from "../../actions/auth";
import type { AppDispatch } from "../../store";

// App.js switches from LoginPage to Home automatically once redux `auth.tokens`
// is set (see mapStateToProps there), so no explicit post-login navigation
// is needed here.
export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(loginUser({ username, password }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 400, p: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <StorefrontIcon sx={{ color: "primary.contrastText", fontSize: 32 }} />
          </Box>
          <Typography variant="h5" component="h1">
            Mobile POS
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            name="username"
            label="Username"
            placeholder="Username"
            fullWidth
            required
            autoFocus
            margin="normal"
            value={username}
            disabled={loading}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            name="password"
            label="Password"
            placeholder="Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Log In"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
