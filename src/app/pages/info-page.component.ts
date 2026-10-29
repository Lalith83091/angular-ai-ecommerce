import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="info-page">
      <p class="eyebrow">Angular AI</p>
      <h1>{{ title() }}</h1>
      <p>{{ message() }}</p>
      <a routerLink="/">Back to Home <span aria-hidden="true">→</span></a>
    </section>
  `,
})
export class InfoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
  readonly title = computed(() => (this.routeData()['heading'] as string | undefined) ?? 'Welcome');
  readonly message = computed(
    () => (this.routeData()['message'] as string | undefined) ?? 'This page is coming soon.',
  );
}
