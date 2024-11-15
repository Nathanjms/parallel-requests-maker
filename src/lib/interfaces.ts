export interface Header {
	key: string;
	value: string;
}
export interface RequestInterface {
	id: number;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	url: string;
	headers: Header[];
	body: string;
}
