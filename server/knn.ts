import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { db, Property } from './db.js';

const METADATA_PATH = path.join(process.cwd(), 'models', 'model_metadata.json');

export interface FeatureInput {
  Square_Feet: number;
  Num_Bedrooms: number;
  Num_Bathrooms: number;
  Num_Floors: number;
  Year_Built: number;
  Has_Garden: number;
  Has_Pool: number;
  Garage_Size: number;
  Location_Score: number;
  Distance_to_Center: number;
  k?: number;
}

export interface NearestNeighbor {
  property_id: number;
  distance: number;
  similarity_pct: number;
  square_feet: number;
  num_bedrooms: number;
  num_bathrooms: number;
  num_floors: number;
  year_built: number;
  has_garden: number;
  has_pool: number;
  garage_size: number;
  location_score: number;
  distance_to_center: number;
  actual_price: number;
}

export interface PredictionResult {
  predicted_price: number;
  k_used: number;
  model_name: string;
  metric: string;
  input_features: Record<string, number>;
  nearest_neighbors: NearestNeighbor[];
  execution_engine: 'node-fast' | 'python-scikit';
}

const FEATURE_COLUMNS = [
  'Square_Feet',
  'Num_Bedrooms',
  'Num_Bathrooms',
  'Num_Floors',
  'Year_Built',
  'Has_Garden',
  'Has_Pool',
  'Garage_Size',
  'Location_Score',
  'Distance_to_Center'
] as const;

const DB_COL_MAP: Record<string, keyof Property> = {
  Square_Feet: 'square_feet',
  Num_Bedrooms: 'num_bedrooms',
  Num_Bathrooms: 'num_bathrooms',
  Num_Floors: 'num_floors',
  Year_Built: 'year_built',
  Has_Garden: 'has_garden',
  Has_Pool: 'has_pool',
  Garage_Size: 'garage_size',
  Location_Score: 'location_score',
  Distance_to_Center: 'distance_to_center'
};

export function getModelMetadata() {
  if (!fs.existsSync(METADATA_PATH)) {
    throw new Error('Model metadata not found. Please train model first.');
  }
  return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
}

export function predictKNN(input: FeatureInput, customK?: number): PredictionResult {
  const metadata = getModelMetadata();
  const defaultK = metadata.best_k || 8;
  const k = Math.min(Math.max(Number(customK || input.k || defaultK), 1), 50);

  // Fetch all properties from DB
  const rows = db.prepare(`
    SELECT id, square_feet, num_bedrooms, num_bathrooms, num_floors,
           year_built, has_garden, has_pool, garage_size, location_score,
           distance_to_center, price
    FROM properties
    ORDER BY id ASC
  `).all() as Property[];

  if (rows.length === 0) {
    throw new Error('No properties found in database for nearest neighbor matching.');
  }

  // Standardize input vector using metadata means & standard deviations
  const normInput = FEATURE_COLUMNS.map((feature) => {
    const stat = metadata.feature_stats[feature];
    const val = Number(input[feature] ?? stat.mean);
    return (val - stat.mean) / (stat.std || 1);
  });

  // Calculate Euclidean distances
  const scored = rows.map((prop) => {
    let sumSq = 0;
    FEATURE_COLUMNS.forEach((feature, idx) => {
      const stat = metadata.feature_stats[feature];
      const dbPropKey = DB_COL_MAP[feature];
      const propVal = Number(prop[dbPropKey]);
      const normPropVal = (propVal - stat.mean) / (stat.std || 1);
      const diff = normInput[idx] - normPropVal;
      sumSq += diff * diff;
    });
    const dist = Math.sqrt(sumSq);
    return {
      prop,
      dist
    };
  });

  // Sort ascending by Euclidean distance
  scored.sort((a, b) => a.dist - b.dist);
  const topNeighbors = scored.slice(0, k);

  // Calculate weighted prediction: weights = 'distance'
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of topNeighbors) {
    // If distance is near zero, property is an exact match
    if (item.dist < 1e-7) {
      weightedSum = item.prop.price;
      totalWeight = 1;
      break;
    }
    const weight = 1.0 / item.dist;
    weightedSum += item.prop.price * weight;
    totalWeight += weight;
  }

  const predictedPrice = Math.round((weightedSum / totalWeight) * 100) / 100;

  const neighbors: NearestNeighbor[] = topNeighbors.map((item) => {
    // Normalized similarity percentage estimate based on Euclidean distance in 10-D standard space
    const sim = Math.max(0, Math.min(100, Math.round((100 - item.dist * 15) * 10) / 10));
    return {
      property_id: item.prop.id,
      distance: Math.round(item.dist * 10000) / 10000,
      similarity_pct: sim,
      square_feet: Math.round(item.prop.square_feet * 100) / 100,
      num_bedrooms: item.prop.num_bedrooms,
      num_bathrooms: item.prop.num_bathrooms,
      num_floors: item.prop.num_floors,
      year_built: item.prop.year_built,
      has_garden: item.prop.has_garden,
      has_pool: item.prop.has_pool,
      garage_size: item.prop.garage_size,
      location_score: Math.round(item.prop.location_score * 100) / 100,
      distance_to_center: Math.round(item.prop.distance_to_center * 100) / 100,
      actual_price: Math.round(item.prop.price * 100) / 100
    };
  });

  const featureRecord: Record<string, number> = {};
  FEATURE_COLUMNS.forEach((col) => {
    featureRecord[col] = Number(input[col] ?? metadata.feature_stats[col].mean);
  });

  return {
    predicted_price: predictedPrice,
    k_used: k,
    model_name: metadata.model_name || 'KNN Regressor (Distance Weighted)',
    metric: 'Euclidean Distance (StandardScaler)',
    input_features: featureRecord,
    nearest_neighbors: neighbors,
    execution_engine: 'node-fast'
  };
}

export function predictKNNViaPython(input: FeatureInput, customK?: number): Promise<PredictionResult> {
  return new Promise((resolve, reject) => {
    const k = customK || input.k || 8;
    const pythonScript = path.join(process.cwd(), 'ml', 'predict.py');
    const pyProcess = spawn('python3', [
      '-c',
      `
import sys, json
from ml.predict import predict_property
data = json.loads(sys.argv[1])
k_val = int(sys.argv[2])
res = predict_property(data, k_value=k_val)
print(json.dumps(res))
      `,
      JSON.stringify(input),
      String(k)
    ]);

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (d) => { stdout += d.toString(); });
    pyProcess.stderr.on('data', (d) => { stderr += d.toString(); });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python prediction failed (code ${code}): ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        parsed.execution_engine = 'python-scikit';
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Failed to parse python output: ${err.message}`));
      }
    });
  });
}
