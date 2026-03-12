<script lang="ts">
    import { authClient } from "$lib/auth-client";
    //import { seedWords } from "../seed/seedWords";

    let email = $state("");
    let password = $state("");
    let name = $state("");
    let result = $state<any>(null);
    let error = $state<string | null>(null);

    const signOut = async () => {
        await authClient.signOut();
    };

    const signIn = async (e: SubmitEvent) => {
        e.preventDefault();
        error = null;
        result = null;

        try {
            const { data, error: err } = await authClient.signIn.email({
                email,
                password,
            });

            if (err) {
                error = err.message || JSON.stringify(err);
            } else {
                result = data;
            }
        } catch (e: any) {
            error = e.message;
        }
    };

    const signup = async (e: SubmitEvent) => {
        e.preventDefault();
        error = null;
        result = null;

        try {
            const { data, error: err } = await authClient.signUp.email({
                email,
                password,
                name,
            });

            if (err) {
                error = err.message || JSON.stringify(err);
            } else {
                result = data;
            }
        } catch (e: any) {
            error = e.message;
        }
    };
</script>

<main>
    <h1>Auth Test</h1>

    <div class="forms">
        <form onsubmit={signup}>
            <h2>Sign Up</h2>
            <div>
                <label for="name">Name</label>
                <input id="name" type="text" bind:value={name} />
            </div>
            <div>
                <label for="email-signup">Email</label>
                <input
                    id="email-signup"
                    type="email"
                    bind:value={email}
                    required
                />
            </div>
            <div>
                <label for="password-signup">Password</label>
                <input
                    id="password-signup"
                    type="password"
                    bind:value={password}
                    required
                />
            </div>
            <button type="submit">Sign Up</button>
        </form>

        <form onsubmit={signIn}>
            <h2>Sign In</h2>
            <div>
                <label for="email-signin">Email</label>
                <input
                    id="email-signin"
                    type="email"
                    bind:value={email}
                    required
                />
            </div>
            <div>
                <label for="password-signin">Password</label>
                <input
                    id="password-signin"
                    type="password"
                    bind:value={password}
                    required
                />
            </div>
            <button type="submit">Sign In</button>
        </form>
    </div>

    {#if error}
        <div class="error">
            <strong>Error:</strong>
            {error}
        </div>
    {/if}

    {#if result}
        <div class="success">
            <h3>Success! Action completed.</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
    {/if}

    <div style="margin-top: 2rem;">
        <button onclick={signOut}>Sign out</button>
    </div>

    <form method="post" action="?/seedUnit">
            <input type="hidden" name="id" value=1 />
            <button type="submit" style="color: red;">Seed Unit</button>
    </form>

</main>

<style>
    main {
        padding: 2rem;
        font-family: system-ui, sans-serif;
    }
    .forms {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }
    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 300px;
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
    }
    h2 {
        margin-top: 0;
    }
    div {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    input {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    button {
        padding: 0.75rem;
        background: #0070f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    button:hover {
        background: #005bb5;
    }
    .error {
        color: #d32f2f;
        background: #ffebee;
        padding: 1rem;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        margin-top: 1rem;
    }
    .success {
        background: #e6ffed;
        color: #1b5e20;
        padding: 1rem;
        border: 1px solid #c2e0c6;
        border-radius: 4px;
        margin-top: 1rem;
        overflow-x: auto;
    }
</style>
