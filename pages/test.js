import { Card, Grid } from "@mui/material";

const Test = () => {
  return (
    <Grid container>
      <Grid item size={{ md: 8 }}>
        <Grid container>
          <Grid item size={{ md: 6 }}>
            <Card sx={{ textAlign: "center" }}>1</Card>
          </Grid>
          <Grid item size={{ md: 6 }}>
            <Card sx={{ textAlign: "center" }}>2</Card>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item size={{ md: 6 }}>
            <Card sx={{ textAlign: "center" }}>4</Card>
          </Grid>
          <Grid item size={{ md: 6 }}>
            <Card sx={{ textAlign: "center" }}>5</Card>
          </Grid>
        </Grid>
      </Grid>

      <Grid item size={{ md: 4 }}>
        <Card sx={{ textAlign: "center", height: 50 }}>3</Card>
      </Grid>
    </Grid>
  );
};

export default Test;
