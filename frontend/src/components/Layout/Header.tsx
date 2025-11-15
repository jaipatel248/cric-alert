import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import SportsIcon from '@mui/icons-material/Sports';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ListAltIcon from '@mui/icons-material/ListAlt';

const Header: React.FC = () => {
  return (
    <AppBar position="sticky">
      <Container>
        <Toolbar disableGutters>
          <SportsIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            Cric Alert 🏏
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              startIcon={<HomeIcon />}
            >
              Home
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/monitor"
              startIcon={<NotificationsActiveIcon />}
            >
              Monitor
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/alerts"
              startIcon={<ListAltIcon />}
            >
              Alerts
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
