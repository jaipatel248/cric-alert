import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          Made with <FavoriteIcon sx={{ fontSize: 16, color: 'error.main', verticalAlign: 'middle' }} /> for cricket fans worldwide
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Data from{' '}
          <Link href="https://www.cricbuzz.com" target="_blank" rel="noopener">
            Cricbuzz
          </Link>
          {' • '}
          Powered by{' '}
          <Link href="https://ai.google.dev/" target="_blank" rel="noopener">
            Google Gemini
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
