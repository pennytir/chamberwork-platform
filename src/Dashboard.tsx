import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import GroupsIcon from "@mui/icons-material/Groups";
import StorageIcon from "@mui/icons-material/Storage";
import SettingsIcon from "@mui/icons-material/Settings";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function ChamberworkDashboard() {
  const [activeTab, setActiveTab] = useState("workspaces");

  const plans = [
    { title: "Solo CDE", price: "$15/mo", ram: "1 GB RAM", cpu: "1 Core", target: "Individual dev", url: "alice.chamberwork.space" },
    { title: "Team Starter", price: "$25/mo", ram: "2 GB RAM", cpu: "2 Cores", target: "Small team", url: "acme.chamberwork.space/alice" },
    { title: "Team Pro", price: "$40/mo", ram: "4 GB RAM", cpu: "3 Cores", target: "Growing team", url: "acme.chamberwork.space/alice" },
    { title: "Team Scale", price: "$60/mo", ram: "8 GB RAM", cpu: "4 Cores", target: "Heavy workloads", url: "acme.chamberwork.space/alice" },
  ];

  const activeWorkspaces = [
    { name: "acme-corp", tier: "Team Pro (4GB)", members: 4, url: "https://acme.chamberwork.space/pen", status: "Healthy" },
    { name: "solo-dev-pen", tier: "Solo CDE (1GB)", members: 1, url: "https://pen.chamberwork.space", status: "Healthy" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#0f172a", color: "#f8fafc" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            bgcolor: "#1e293b",
            color: "#f8fafc",
            borderRight: "1px solid #334155"
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#38bdf8" }}>
            Chamberwork
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: "#334155" }} />
        <List>
          <ListItem button onClick={() => setActiveTab("workspaces")} selected={activeTab === "workspaces"}>
            <ListItemIcon sx={{ color: "#94a3b8" }}><ComputerIcon /></ListItemIcon>
            <ListItemText primary="Workspaces" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab("plans")} selected={activeTab === "plans"}>
            <ListItemIcon sx={{ color: "#94a3b8" }}><StorageIcon /></ListItemIcon>
            <ListItemText primary="Tiers & VPS" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab("members")} selected={activeTab === "members"}>
            <ListItemIcon sx={{ color: "#94a3b8" }}><GroupsIcon /></ListItemIcon>
            <ListItemText primary="Team Members" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab("admin")} selected={activeTab === "admin"}>
            <ListItemIcon sx={{ color: "#94a3b8" }}><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Admin API" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: "transparent", mb: 4 }}>
          <Toolbar sx={{ px: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, flexGrow: 1 }}>
              Cloud Development Environments
            </Typography>
            <Button variant="contained" sx={{ bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}>
              New Workspace
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ px: 0 }}>
          {/* Active Workspaces Table */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Active VPS Instances
          </Typography>
          <TableContainer component={Paper} sx={{ bgcolor: "#1e293b", mb: 6, border: "1px solid #334155" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#94a3b8" }}>Tenant / Workspace</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Tier</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Members</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Status</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeWorkspaces.map((ws) => (
                  <TableRow key={ws.name}>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 600 }}>{ws.name}</TableCell>
                    <TableCell sx={{ color: "#cbd5e1" }}>{ws.tier}</TableCell>
                    <TableCell sx={{ color: "#cbd5e1" }}>{ws.members}</TableCell>
                    <TableCell>
                      <Chip label={ws.status} size="small" sx={{ bgcolor: "#065f46", color: "#6ee7b7" }} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewIcon />}
                        href={ws.url}
                        target="_blank"
                        sx={{ borderColor: "#38bdf8", color: "#38bdf8" }}
                      >
                        Open CDE
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pricing Tier Grid */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Available Workspace Plans (No Seat Surcharges)
          </Typography>
          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} sm={6} md={3} key={plan.title}>
                <Card sx={{ bgcolor: "#1e293b", color: "#f8fafc", border: "1px solid #334155", height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#38bdf8" }}>{plan.title}</Typography>
                    <Typography variant="h4" sx={{ my: 1, fontWeight: 700 }}>{plan.price}</Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>{plan.target}</Typography>
                    <Divider sx={{ borderColor: "#334155", my: 1.5 }} />
                    <Typography variant="body2" sx={{ color: "#cbd5e1" }}>• {plan.ram}</Typography>
                    <Typography variant="body2" sx={{ color: "#cbd5e1" }}>• {plan.cpu}</Typography>
                    <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 1, fontStyle: "italic", fontSize: "0.8rem" }}>
                      Route: {plan.url}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button fullWidth variant="contained" sx={{ bgcolor: "#0284c7" }}>
                      Subscribe via Stripe
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
