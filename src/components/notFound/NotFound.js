import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        gap: 2,
        p: 3
      }}
    >
      <Typography variant="h3" component="h1" fontWeight={700}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Page not found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        The requested page could not be found.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
