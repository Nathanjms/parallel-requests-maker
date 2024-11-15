<script lang="ts">
	import { CurlGenerator } from 'curl-generator';
	// define type for the requests:
    interface RequestInterface {
        method: string;
        url: string;
        headers: [];
        body: string;
    }

	const requests: RequestInterface[] = [];

    const formFields: RequestInterface = {
        method: 'GET',
        url: '',
        headers: [],
        body: '',
    }

    function addRequest() {
        
    }
</script>

<div class="container">
    <form on:submit|preventDefault=addRequest>
</div>
