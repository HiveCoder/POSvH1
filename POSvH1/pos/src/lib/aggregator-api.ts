import { call } from './frappe-sdk';
import { IS_WEBSITE_MODE } from './platform';
import { WEBSITE_AGGREGATORS } from './website-mock';

export interface Aggregator {
  customer: string;
}

export interface GetAggregatorsResponse {
  message: Aggregator[];
}

export async function getAggregators(): Promise<Aggregator[]> {
  if (IS_WEBSITE_MODE) {
    return WEBSITE_AGGREGATORS;
  }

  try {
    const response = await call.get<GetAggregatorsResponse>(
      'ury.ury_pos.api.getAggregator'
    );
    return response.message;
  } catch (error: any) {
    if (error._server_messages) {
      const messages = JSON.parse(error._server_messages);
      const message = JSON.parse(messages[0]);
      throw new Error(message.message);
    }
    console.error('Failed to fetch aggregators:', error);
    throw error;
  }
} 