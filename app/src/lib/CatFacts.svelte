<script>
    // some catfact code i copied from chatgpt
    let catFact = '';

    async function getCatFact() {
        try {
            const response = await fetch('https://catfact.ninja/fact');
            const data = await response.json();
            catFact = data.fact;
        } catch (error) {
            catFact = "Failed to load a cat fact.";
            console.error("Error fetching cat fact: ", error);
        }
    }

    import { onMount } from 'svelte';
    onMount(() => {
        getCatFact();
    });
</script>

<style>
    .cat-fact {
        font-size: 1.2rem;
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f9f9f9;
    }
</style>

<div class="cat-fact">
    {#if catFact}
        <p>{catFact}</p>
    {:else}
        <p>Loading cat fact...</p>
    {/if}
</div>

<button on:click={getCatFact}>Get another cat fact</button>

