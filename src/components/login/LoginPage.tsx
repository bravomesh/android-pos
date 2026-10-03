import { FormEvent, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOffRounded";
import WifiOffIcon from "@mui/icons-material/WifiOffRounded";
import CloudDoneIcon from "@mui/icons-material/CloudDoneRounded";
import VerifiedIcon from "@mui/icons-material/VerifiedRounded";
import { toast } from "../../toast/useToast";
import { loginUser } from "../../actions/auth";
import type { AppDispatch } from "../../store";
import { BrandMark } from "../home/Shell";
import { stagger } from "../../theme/motion";

const PROMISES = [
  { icon: <WifiOffIcon />, text: "Works with no internet at all" },
  { icon: <CloudDoneIcon />, text: "Backs itself up every night" },
  { icon: <VerifiedIcon />, text: "Every sale and shilling accounted for" },
];

const Glow = ({ color, size, sx }: { color: string; size: number; sx: object }) => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
      ...sx,
    }}
  />
);

// App.js switches from LoginPage to Home automatically once redux `auth.tokens`
// is set (see mapStateToProps there), so no explicit post-login navigation
// is needed here.
export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const card = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(loginUser({ username, password }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
      setPassword("");
      const el = card.current;
      if (el) {
        el.classList.remove("pos-shake");
        void el.offsetWidth;
        el.classList.add("pos-shake");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" } }}>
      {/* Brand side: only where there is room for it. */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          p: 6,
          color: "#fff",
          background: "linear-gradient(140deg, #064E3B 0%, #047857 50%, #0F766E 100%)",
        }}
      >
        <Glow color={alpha("#FB923C", 0.5)} size={420} sx={{ top: -140, right: -120, animation: "pos-float 10s ease-in-out infinite" }} />
        <Glow color={alpha("#6EE7B7", 0.4)} size={360} sx={{ bottom: -160, left: -80, animation: "pos-float 12s ease-in-out -4s infinite" }} />

        <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5 }} className="pos-enter">
          <BrandMark size={48} />
          <Typography variant="h5" sx={{ color: "#fff" }}>
            Mobile POS
          </Typography>
        </Box>

        <Box sx={{ position: "relative", maxWidth: 440 }}>
          <Typography variant="h3" sx={{ color: "#fff", fontSize: "2.6rem", lineHeight: 1.15 }} className="pos-enter">
            Your shop, in one tablet.
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 4, display: "grid", gap: 2 }}>
            {PROMISES.map((item, i) => (
              <Box
                component="li"
                key={item.text}
                className="pos-enter"
                sx={{ display: "flex", alignItems: "center", gap: 1.5, animationDelay: stagger(i + 2, 90) }}
              >
                <Box
                  aria-hidden
                  sx={{ width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.15)" }}
                >
                  {item.icon}
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: "1.05rem" }}>{item.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ position: "relative", opacity: 0.7 }}>
          All data stays on this device.
        </Typography>
      </Box>

      {/* Sign-in side. */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2, position: "relative", overflow: "hidden" }}>
        <Glow
          color={alpha("#10B981", 0.18)}
          size={380}
          sx={{ display: { md: "none" }, top: -160, left: "50%", transform: "translateX(-50%)" }}
        />
        <Card ref={card} className="pos-enter" sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 }, position: "relative" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3, textAlign: "center" }}>
            <Box sx={{ display: { md: "none" }, mb: 2 }}>
              <BrandMark size={56} />
            </Box>
            <Typography variant="h5" component="h1">
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to open the till
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "grid", gap: 2 }}>
            <TextField
              name="username"
              label="Username"
              fullWidth
              required
              autoFocus
              autoComplete="username"
              value={username}
              disabled={loading}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              autoComplete="current-password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        sx={{ width: 44, height: 44 }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 1, minHeight: 52 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : "Log In"}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
