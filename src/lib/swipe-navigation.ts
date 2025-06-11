import { goto } from '$app/navigation';

export interface SwipeOptions {
	/** Minimum distance in pixels for a swipe to be recognized */
	minSwipeDistance?: number;
	/** Whether to prevent default browser behavior on swipes */
	preventDefault?: boolean;
	/** Function to check if swipe handling should be disabled */
	shouldDisableSwipe?: () => boolean;
	/** Custom swipe handlers for different directions */
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
}

export interface PageSwipeConfig {
	/** Current page path */
	currentPage: '/spinner' | '/lists' | '/combos';
	/** Custom swipe options */
	options?: SwipeOptions;
}

export class SwipeNavigationHandler {
	private touchStartX = 0;
	private touchStartY = 0;
	private touchEndX = 0;
	private touchEndY = 0;
	private isSwipeGesture = false;
	private options: Required<SwipeOptions>;
	private currentPage: string;

	constructor(config: PageSwipeConfig) {
		this.currentPage = config.currentPage;
		this.options = {
			minSwipeDistance: 50,
			preventDefault: true,
			shouldDisableSwipe: () => false,
			onSwipeLeft: () => this.handleDefaultSwipeLeft(),
			onSwipeRight: () => this.handleDefaultSwipeRight(),
			onSwipeUp: () => {},
			onSwipeDown: () => {},
			...config.options
		};
	}

	private handleDefaultSwipeLeft() {
		// Default left swipe behavior based on current page
		switch (this.currentPage) {
			case '/spinner':
				goto('/combos');
				break;
			case '/lists':
				goto('/spinner');
				break;
			case '/combos':
				// Already on rightmost page, no action
				break;
		}
	}

	private handleDefaultSwipeRight() {
		// Default right swipe behavior based on current page
		switch (this.currentPage) {
			case '/spinner':
				goto('/lists');
				break;
			case '/lists':
				// Already on leftmost page, no action
				break;
			case '/combos':
				goto('/spinner');
				break;
		}
	}

	handleTouchStart = (event: Event) => {
		const touchEvent = event as TouchEvent;
		if (this.options.shouldDisableSwipe()) return;

		this.touchStartX = touchEvent.touches[0].clientX;
		this.touchStartY = touchEvent.touches[0].clientY;
		this.isSwipeGesture = false;
	};

	handleTouchMove = (event: Event) => {
		const touchEvent = event as TouchEvent;
		if (this.options.shouldDisableSwipe()) return;

		const currentX = touchEvent.touches[0].clientX;
		const currentY = touchEvent.touches[0].clientY;
		const deltaX = Math.abs(currentX - this.touchStartX);
		const deltaY = Math.abs(currentY - this.touchStartY);

		// Only prevent default and mark as swipe gesture for horizontal swipes
		// This preserves vertical scrolling behavior
		if (deltaX > deltaY && deltaX > 10) {
			if (this.options.preventDefault) {
				touchEvent.preventDefault();
			}
			this.isSwipeGesture = true;
		}
	};

	handleTouchEnd = (event: Event) => {
		const touchEvent = event as TouchEvent;
		if (this.options.shouldDisableSwipe()) return;

		this.touchEndX = touchEvent.changedTouches[0].clientX;
		this.touchEndY = touchEvent.changedTouches[0].clientY;

		const deltaX = this.touchEndX - this.touchStartX;
		const deltaY = this.touchEndY - this.touchStartY;

		// Check for horizontal swipes (page navigation)
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.options.minSwipeDistance) {
			if (this.options.preventDefault) {
				touchEvent.preventDefault();
				touchEvent.stopPropagation();
			}
			this.isSwipeGesture = true;

			if (deltaX > 0) {
				// Swipe right (left to right)
				this.options.onSwipeRight();
			} else {
				// Swipe left (right to left)
				this.options.onSwipeLeft();
			}
		}
		// Check for vertical swipes (only for spinner page special actions)
		else if (
			Math.abs(deltaY) > Math.abs(deltaX) &&
			Math.abs(deltaY) > this.options.minSwipeDistance
		) {
			// Only handle vertical swipes if explicitly configured (don't prevent default to preserve scrolling)
			if (this.options.onSwipeDown || this.options.onSwipeUp) {
				this.isSwipeGesture = true;

				if (deltaY > 0) {
					// Swipe down (top to bottom)
					this.options.onSwipeDown();
				} else {
					// Swipe up (bottom to top)
					this.options.onSwipeUp();
				}
			}
		}

		// Reset swipe gesture flag after a short delay
		setTimeout(() => {
			this.isSwipeGesture = false;
		}, 100);
	};

	/**
	 * Returns true if the last touch event was part of a swipe gesture
	 * Useful for preventing click events after swipes
	 */
	getIsSwipeGesture(): boolean {
		return this.isSwipeGesture;
	}

	/**
	 * Update the current page for proper navigation context
	 */
	updateCurrentPage(page: '/spinner' | '/lists' | '/combos') {
		this.currentPage = page;
	}

	/**
	 * Add event listeners to an element
	 */
	attachToElement(element: HTMLElement | Document): () => void {
		// Use passive listeners for better performance, only non-passive when we need to prevent default
		element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
		element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
		element.addEventListener('touchend', this.handleTouchEnd, { passive: false });

		// Return cleanup function
		return () => {
			element.removeEventListener('touchstart', this.handleTouchStart);
			element.removeEventListener('touchmove', this.handleTouchMove);
			element.removeEventListener('touchend', this.handleTouchEnd);
		};
	}
}

/**
 * Svelte action for easy swipe navigation setup
 * Usage: <div use:swipeNavigation={{ currentPage: '/spinner' }}>
 */
export function swipeNavigation(element: HTMLElement, config: PageSwipeConfig) {
	const handler = new SwipeNavigationHandler(config);
	const cleanup = handler.attachToElement(element);

	return {
		update(newConfig: PageSwipeConfig) {
			cleanup();
			const newHandler = new SwipeNavigationHandler(newConfig);
			return newHandler.attachToElement(element);
		},
		destroy: cleanup
	};
}
