import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsChartsProps {
  data: {
    completenessScore: number;
    feasibilityRating: number;
    riskLevel: string;
    priceDeviationPercentage: number;
    priceAnalysis?: {
      flaggedItems: Array<{
        item: string;
        standardPrice: number;
        quotedPrice: number;
        deviation: number;
      }>;
    };
    schemeMatches?: Array<{
      schemeName: string;
      eligibility: string;
      fundingAmount: number;
    }>;
  };
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  const theme = useTheme();

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return theme.palette.success.main;
      case 'MEDIUM': return theme.palette.warning.main;
      case 'HIGH': case 'CRITICAL': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Prepare chart data
  const overviewData = [
    { 
      name: 'Completeness', 
      score: data.completenessScore, 
      fill: getScoreColor(data.completenessScore) 
    },
    { 
      name: 'Feasibility', 
      score: data.feasibilityRating, 
      fill: getScoreColor(data.feasibilityRating) 
    },
    { 
      name: 'Price Accuracy', 
      score: Math.max(0, 100 - Math.abs(data.priceDeviationPercentage)), 
      fill: getScoreColor(100 - Math.abs(data.priceDeviationPercentage)) 
    }
  ];

  const priceComparisonData = data.priceAnalysis?.flaggedItems.slice(0, 5).map(item => ({
    name: item.item.split(' ')[0],
    standard: item.standardPrice,
    quoted: item.quotedPrice,
    deviation: item.deviation
  })) || [];

  const schemeData = data.schemeMatches?.map((scheme, index) => ({
    name: scheme.schemeName.split(' ').slice(0, 2).join(' '),
    value: scheme.fundingAmount / 100000, // Convert to lakhs
    fill: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]
  })) || [];

  const riskData = [
    { name: 'Jan', risk: 30 },
    { name: 'Feb', risk: 25 },
    { name: 'Mar', risk: data.riskLevel === 'HIGH' ? 80 : data.riskLevel === 'MEDIUM' ? 50 : 20 },
    { name: 'Apr', risk: data.riskLevel === 'HIGH' ? 75 : data.riskLevel === 'MEDIUM' ? 45 : 18 },
    { name: 'May', risk: data.riskLevel === 'HIGH' ? 70 : data.riskLevel === 'MEDIUM' ? 40 : 15 },
    { name: 'Jun', risk: data.riskLevel === 'HIGH' ? 85 : data.riskLevel === 'MEDIUM' ? 55 : 25 }, // Monsoon risk
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Grid container spacing={3}>
      {/* Performance Overview */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Overview
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                <Bar dataKey="score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Trend */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Trend Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Risk Level']} />
                <Area 
                  type="monotone" 
                  dataKey="risk" 
                  stroke={getRiskColor(data.riskLevel)} 
                  fill={getRiskColor(data.riskLevel)}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Price Comparison */}
      {priceComparisonData.length > 0 && (
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Comparison Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    name === 'standard' ? 'Standard Price' : 'Quoted Price'
                  ]} />
                  <Legend />
                  <Bar dataKey="standard" fill="#82ca9d" name="Standard Price" />
                  <Bar dataKey="quoted" fill="#8884d8" name="Quoted Price" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Scheme Funding Distribution */}
      {schemeData.length > 0 && (
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Funding Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={schemeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {schemeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${(Number(value) * 100000).toLocaleString('en-IN')}`, 'Funding']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Monthly Progress Trend */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Progress Simulation
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { month: 'Month 1', planned: 10, actual: 8 },
                { month: 'Month 2', planned: 25, actual: 22 },
                { month: 'Month 3', planned: 45, actual: 40 },
                { month: 'Month 4', planned: 65, actual: 58 },
                { month: 'Month 5', planned: 80, actual: 75 },
                { month: 'Month 6', planned: 100, actual: 95 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="#8884d8" 
                  strokeDasharray="5 5"
                  name="Planned Progress"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#82ca9d" 
                  name="Projected Progress"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AnalyticsCharts;