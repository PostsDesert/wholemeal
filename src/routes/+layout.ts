// TODO: Maybe enable prerendering?
// https://svelte.dev/docs/kit/page-options#prerender-When-not-to-prerender

export const ssr = false;

export const load = ({ url }) => {
    const { pathname } = url;
    console.log(pathname)

    return {
        pathname
    };
};
