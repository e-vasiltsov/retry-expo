import {wait} from './wait';

export const DEFAULT_RETRIES = 5;
export const DEFAULT_INTERVAL = 200;
export const DEFAULT_SHOULD_LOG = true;
export const DEFAULT_BACKOFF_INCREMENT = 200;

type RetryFunction<ResultT> = () => ResultT;

type ShouldRetryFunction<ResultT> = (fn: RetryFunction<ResultT>) => Promise<ShouldRetry<ResultT>>;

type ShouldRetry<ResultT> = {
	shouldRetry: boolean;
	result: ResultT;
};

type RetryArguments<ResultT> = {
	fn: RetryFunction<ResultT>;
	shouldRetry: ShouldRetryFunction<ResultT>;
	retries?: number;
	interval?: number;
	backoffIncrement?: number;
	shouldLog?: boolean;
};

export async function retry<ResultT>(args: RetryArguments<ResultT>): Promise<ResultT> {
	const {fn, shouldRetry,
		retries = DEFAULT_RETRIES,
		interval = DEFAULT_INTERVAL,
		shouldLog = DEFAULT_SHOULD_LOG,
		backoffIncrement = DEFAULT_BACKOFF_INCREMENT,
	} = args;

	args.retries = retries - 1;

	const retryRes = await shouldRetry(fn);
	if (!retryRes.shouldRetry) {
		return retryRes.result;
	}

	await wait(interval);

	if (args.retries < 1) {
		if (shouldLog) {
			console.warn('Maximum retries exceeded!: ', args.retries);
		}

		return retryRes.result;
	}

	if (shouldLog) {
		console.info('retries left:', args.retries);
	}

	args.interval = interval + backoffIncrement;

	return retry(args);
}
