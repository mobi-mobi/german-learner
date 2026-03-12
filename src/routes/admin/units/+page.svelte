<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageProps } from "./$types";

    let { data, form }: PageProps = $props();

    let unit = $state(0);
    let title = $state("");
    let description = $state("");
</script>

<h1>Admin Page</h1>

{#if form?.success}
    <p style="color: green;">{form?.message}</p>
{/if}

{#if form?.error}
    <p style="color: red;">{form?.error}</p>
{/if}

<form method="post" action="?/createUnit" use:enhance>
    <label for="unit">Unit</label>
    <input type="number" id="unit" name="unit" bind:value={unit} />
    <label for="title">Title</label>
    <input type="text" id="title" name="title" bind:value={title} />
    <label for="description">Description</label>
    <input
        type="text"
        id="description"
        name="description"
        bind:value={description}
    />
    <button type="submit">Create Unit</button>
</form>

{#each data.units as unitItem}
    <div
        style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px;"
    >
        <p><strong>Number:</strong> {unitItem.number}</p>
        <p><strong>Title:</strong> {unitItem.title}</p>
        <p><strong>Description:</strong> {unitItem.description}</p>
        <a href={`/admin/units/${unitItem.id}`}>Details</a>

        <form method="post" action="?/deleteUnit" use:enhance>
            <input type="hidden" name="id" value={unitItem.id} />
            <button type="submit" style="color: red;">Delete</button>
        </form>

        
    </div>
{/each}

<form method="post" action="?/seedUnit">
            <input type="hidden" name="id" value=1 />
            <button type="submit" style="color: red;">Seed Unit</button>
</form>
