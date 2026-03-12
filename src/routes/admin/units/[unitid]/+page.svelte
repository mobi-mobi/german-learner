<script>
    let {data} = $props();
</script>

<h1>Admin {data.unit?.title}</h1>

{#if data.unit}
    <p><strong>Number:</strong> {data.unit.number}</p>
    <p><strong>Title:</strong> {data.unit.title}</p>
    <p><strong>Description:</strong> {data.unit.description}</p>
{/if}

<form method="post" action="?/delete">
    <button type="submit" name="action" value="delete">Delete Unit</button>
</form>