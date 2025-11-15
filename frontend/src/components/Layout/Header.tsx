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
              startIcon={<HomeIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
              sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Home
              </Box>
              <HomeIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/monitor"
              startIcon={<NotificationsActiveIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
              sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Monitor
              </Box>
              <NotificationsActiveIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/alerts"
              startIcon={<ListAltIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
              sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Alerts
              </Box>
              <ListAltIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
