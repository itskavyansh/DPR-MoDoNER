import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GeospatialService } from '../services/geospatialService.js';
import {
  LocationVerificationRequest,
  GeospatialVerificationResult,
  LocationVerificationResult,
  GeographicLocation
} from '@dpr-system/shared';

interface VerifyLocationBody {
  dprId: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    address?: string;
    state?: string;
    district?: string;
    pincode?: string;
    accuracy?: number;
  };
  address?: string;
  projectName?: string;
  verificationLevel?: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
}

interface BatchVerifyLocationsBody {
  requests: VerifyLocationBody[];
}

interface UpdateLocationBody {
  dprId: string;
  correctedLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    state?: string;
    district?: string;
    pincode?: string;
  };
  verificationNotes?: string;
}

export async function geospatialVerificationRoutes(fastify: FastifyInstance) {
  const geospatialService = new GeospatialService(fastify.log);

  // Comprehensive geospatial verification
  fastify.post<{ Body: VerifyLocationBody }>(
    '/verify-location',
    {
      schema: {
        description: 'Perform comprehensive geospatial verification including location verification, site accessibility analysis, and map visualization',
        tags: ['Geospatial Verification'],
        body: {
          type: 'object',
          required: ['dprId'],
          properties: {
            dprId: { type: 'string', description: 'DPR document ID' },
            coordinates: {
              type: 'object',
              properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 },
                address: { type: 'string' },
                state: { type: 'string' },
                district: { type: 'string' },
                pincode: { type: 'string' },
                accuracy: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['latitude', 'longitude']
            },
            address: { type: 'string', description: 'Address to geocode if coordinates not provided' },
            projectName: { type: 'string', description: 'Project name for reference' },
            verificationLevel: {
              type: 'string',
              enum: ['BASIC', 'DETAILED', 'COMPREHENSIVE'],
              default: 'COMPREHENSIVE'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            description: 'Comprehensive geospatial verification result'
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: VerifyLocationBody }>, reply: FastifyReply) => {
      try {
        const { dprId, coordinates, address, projectName, verificationLevel = 'COMPREHENSIVE' } = request.body;

        // Validate input
        if (!coordinates && !address) {
          return reply.status(400).send({
            error: 'INVALID_INPUT',
            message: 'Either coordinates or address must be provided'
          });
        }

        // Convert coordinates if provided
        let geographicLocation: GeographicLocation | undefined;
        if (coordinates) {
          geographicLocation = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            address: coordinates.address,
            state: coordinates.state,
            district: coordinates.district,
            pincode: coordinates.pincode,
            accuracy: coordinates.accuracy
          };
        }

        const verificationRequest: LocationVerificationRequest = {
          dprId,
          coordinates: geographicLocation,
          address,
          projectName,
          verificationLevel
        };

        const result: GeospatialVerificationResult = await geospatialService.performGeospatialVerification(verificationRequest);

        return reply.send(result);

      } catch (error) {
        fastify.log.error('Geospatial verification failed:', error);
        return reply.status(500).send({
          error: 'VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  );

  // Location verification only (lightweight)
  fastify.post<{ Body: VerifyLocationBody }>(
    '/verify-location-only',
    {
      schema: {
        description: 'Verify and geocode location only without full site analysis',
        tags: ['Geospatial Verification'],
        body: {
          type: 'object',
          required: ['dprId'],
          properties: {
            dprId: { type: 'string' },
            coordinates: {
              type: 'object',
              properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 },
                address: { type: 'string' },
                state: { type: 'string' },
                district: { type: 'string' },
                pincode: { type: 'string' },
                accuracy: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['latitude', 'longitude']
            },
            address: { type: 'string' },
            verificationLevel: {
              type: 'string',
              enum: ['BASIC', 'DETAILED', 'COMPREHENSIVE'],
              default: 'BASIC'
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: VerifyLocationBody }>, reply: FastifyReply) => {
      try {
        const { dprId, coordinates, address, verificationLevel = 'BASIC' } = request.body;

        if (!coordinates && !address) {
          return reply.status(400).send({
            error: 'INVALID_INPUT',
            message: 'Either coordinates or address must be provided'
          });
        }

        let geographicLocation: GeographicLocation | undefined;
        if (coordinates) {
          geographicLocation = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            address: coordinates.address,
            state: coordinates.state,
            district: coordinates.district,
            pincode: coordinates.pincode,
            accuracy: coordinates.accuracy
          };
        }

        const verificationRequest: LocationVerificationRequest = {
          dprId,
          coordinates: geographicLocation,
          address,
          verificationLevel
        };

        const result: LocationVerificationResult = await geospatialService.verifyLocationOnly(verificationRequest);

        return reply.send(result);

      } catch (error) {
        fastify.log.error('Location verification failed:', error);
        return reply.status(500).send({
          error: 'VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  );

  // Batch location verification
  fastify.post<{ Body: BatchVerifyLocationsBody }>(
    '/batch-verify-locations',
    {
      schema: {
        description: 'Verify multiple locations in batch',
        tags: ['Geospatial Verification'],
        body: {
          type: 'object',
          required: ['requests'],
          properties: {
            requests: {
              type: 'array',
              items: {
                type: 'object',
                required: ['dprId'],
                properties: {
                  dprId: { type: 'string' },
                  coordinates: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                      address: { type: 'string' }
                    }
                  },
                  address: { type: 'string' },
                  verificationLevel: { type: 'string', enum: ['BASIC', 'DETAILED', 'COMPREHENSIVE'] }
                }
              },
              maxItems: 10
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: BatchVerifyLocationsBody }>, reply: FastifyReply) => {
      try {
        const { requests } = request.body;

        if (requests.length === 0) {
          return reply.status(400).send({
            error: 'INVALID_INPUT',
            message: 'At least one verification request is required'
          });
        }

        if (requests.length > 10) {
          return reply.status(400).send({
            error: 'INVALID_INPUT',
            message: 'Maximum 10 requests allowed per batch'
          });
        }

        // Convert to LocationVerificationRequest format
        const verificationRequests: LocationVerificationRequest[] = requests.map(req => {
          let geographicLocation: GeographicLocation | undefined;
          if (req.coordinates) {
            geographicLocation = {
              latitude: req.coordinates.latitude,
              longitude: req.coordinates.longitude,
              address: req.coordinates.address
            };
          }

          return {
            dprId: req.dprId,
            coordinates: geographicLocation,
            address: req.address,
            verificationLevel: req.verificationLevel || 'BASIC'
          };
        });

        const results = await geospatialService.batchVerifyLocations(verificationRequests);

        return reply.send({
          totalRequests: requests.length,
          successfulVerifications: results.length,
          results
        });

      } catch (error) {
        fastify.log.error('Batch location verification failed:', error);
        return reply.status(500).send({
          error: 'BATCH_VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  );

  // Update location with manual corrections
  fastify.put<{ Body: UpdateLocationBody }>(
    '/update-location',
    {
      schema: {
        description: 'Update location verification with manual corrections',
        tags: ['Geospatial Verification'],
        body: {
          type: 'object',
          required: ['dprId', 'correctedLocation'],
          properties: {
            dprId: { type: 'string' },
            correctedLocation: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 },
                address: { type: 'string' },
                state: { type: 'string' },
                district: { type: 'string' },
                pincode: { type: 'string' }
              }
            },
            verificationNotes: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: UpdateLocationBody }>, reply: FastifyReply) => {
      try {
        const { dprId, correctedLocation, verificationNotes } = request.body;

        const result = await geospatialService.updateLocationVerification(
          dprId,
          correctedLocation,
          verificationNotes
        );

        return reply.send(result);

      } catch (error) {
        fastify.log.error('Location update failed:', error);
        return reply.status(500).send({
          error: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  );

  // Get verification status
  fastify.get<{ Params: { dprId: string } }>(
    '/status/:dprId',
    {
      schema: {
        description: 'Get verification status for a DPR',
        tags: ['Geospatial Verification'],
        params: {
          type: 'object',
          required: ['dprId'],
          properties: {
            dprId: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: { dprId: string } }>, reply: FastifyReply) => {
      try {
        const { dprId } = request.params;

        // In a real implementation, this would query a database for stored verification results
        // For now, return a placeholder response
        return reply.send({
          dprId,
          status: 'NOT_VERIFIED',
          message: 'No verification found for this DPR. Please run verification first.',
          lastVerified: null
        });

      } catch (error) {
        fastify.log.error('Status check failed:', error);
        return reply.status(500).send({
          error: 'STATUS_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  );

  // Health check endpoint
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check for geospatial verification service',
        tags: ['Health']
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        status: 'healthy',
        service: 'geospatial-verification',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  );
}