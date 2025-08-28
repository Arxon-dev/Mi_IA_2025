import React from 'react';
import { Grid } from '@mui/material';

export default function TestGrid() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>Hola</Grid>
      <Grid item xs={12} md={6}>Mundo</Grid>
    </Grid>
  );
} 