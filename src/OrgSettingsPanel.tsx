import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  Divider,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid
} from "@mui/material";

export default function OrgSettingsPanel() {
  // Token Saver Settings (RTK, Caveman, Ponytail)
  const [rtkEnabled, setRtkEnabled] = useState(true);
  const [cavemanEnabled, setCavemanEnabled] = useState(false);
  const [cavemanLevel, setCavemanLevel] = useState("moderate");
  const [ponytailEnabled, setPonytailEnabled] = useState(true);
  const [ponytailLevel, setPonytailLevel] = useState("full");

  // OpenAI Org Model Sync Settings
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiOrgId, setOpenaiOrgId] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    // Post to /api/org/models/agreements and /api/settings/token-saver
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <Box sx={{ p: 4, bgcolor: "#0f172a", color: "#f8fafc", minHeight: "100vh" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: "#38bdf8" }}>
        Organization Workspace Controls
      </Typography>
      <Typography variant="body1" sx={{ color: "#94a3b8", mb: 4 }}>
        Configure organization-wide LLM agreements, automatic user credential syncing, and token optimizers.
      </Typography>

      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Organization settings and model agreements synchronized successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 1. Direct OpenAI Enterprise / Plan Sync */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#38bdf8" }}>
                🏢 Direct Organization OpenAI Plan Sync
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                Sync your company's OpenAI agreements directly to all staff accounts. When a team member signs in, their OpenChamber instance automatically receives their OpenAI model access.
              </Typography>

              <TextField
                fullWidth
                label="Company OpenAI API Key"
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-proj-..."
                sx={{ mb: 2, input: { color: "white" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
              />

              <TextField
                fullWidth
                label="OpenAI Organization ID (Optional)"
                value={openaiOrgId}
                onChange={(e) => setOpenaiOrgId(e.target.value)}
                placeholder="org-..."
                sx={{ mb: 3, input: { color: "white" }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
              />

              <Alert severity="info" sx={{ bgcolor: "#0f172a", color: "#38bdf8" }}>
                Auto-Sync: New staff logging into this workspace are immediately mapped to these models.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Token Saver Controls: RTK, Caveman, Ponytail */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#38bdf8" }}>
                ⚡ Token Saver & Output Compression
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                Reduce token consumption and prevent context exhaustion using integrated pre-processors.
              </Typography>

              {/* RTK */}
              <FormControlLabel
                control={<Switch checked={rtkEnabled} onChange={(e) => setRtkEnabled(e.target.checked)} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>RTK Input Compression (-20% to -40%)</Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Compresses large git diff, grep, and ls outputs before sending to LLM.
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: "flex", alignItems: "flex-start" }}
              />

              <Divider sx={{ borderColor: "#334155", my: 2 }} />

              {/* Caveman */}
              <FormControlLabel
                control={<Switch checked={cavemanEnabled} onChange={(e) => setCavemanEnabled(e.target.checked)} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Caveman Output Optimizer (Up to -65% Output)</Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Forces terse, non-conversational LLM output while keeping technical details intact.
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1, display: "flex", alignItems: "flex-start" }}
              />
              {cavemanEnabled && (
                <Box sx={{ pl: 6, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>Intensity Level:</Typography>
                  <Select
                    size="small"
                    value={cavemanLevel}
                    onChange={(e) => setCavemanLevel(e.target.value)}
                    sx={{ color: "white", ml: 2, bgcolor: "#0f172a" }}
                  >
                    <MenuItem value="subtle">Subtle (-20%)</MenuItem>
                    <MenuItem value="moderate">Moderate (-40%)</MenuItem>
                    <MenuItem value="aggressive">Aggressive (-65%)</MenuItem>
                  </Select>
                </Box>
              )}

              <Divider sx={{ borderColor: "#334155", my: 2 }} />

              {/* Ponytail */}
              <FormControlLabel
                control={<Switch checked={ponytailEnabled} onChange={(e) => setPonytailEnabled(e.target.checked)} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Ponytail Lazy Senior Dev Mode (YAGNI)</Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Directs agents to make the smallest change that solves the problem.
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1, display: "flex", alignItems: "flex-start" }}
              />
              {ponytailEnabled && (
                <Box sx={{ pl: 6 }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>Level:</Typography>
                  <Select
                    size="small"
                    value={ponytailLevel}
                    onChange={(e) => setPonytailLevel(e.target.value)}
                    sx={{ color: "white", ml: 2, bgcolor: "#0f172a" }}
                  >
                    <MenuItem value="lite">Lite</MenuItem>
                    <MenuItem value="full">Full (Recommended)</MenuItem>
                    <MenuItem value="ultra">Ultra Minimal</MenuItem>
                  </Select>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="large" onClick={handleSave} sx={{ bgcolor: "#0284c7", px: 4 }}>
          Save & Lock Workspace Settings
        </Button>
      </Box>
    </Box>
  );
}
