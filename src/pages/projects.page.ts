import { expect, type Locator, type Page } from '@playwright/test';

export interface ProjectData {
  key: string;
  name: string;
}

export class ProjectsPage {
  readonly root: Locator;
  readonly createButton: Locator;
  readonly keyInput: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly currentProject: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('projects-page');
    this.createButton = page.getByTestId('projects-create-button');
    this.keyInput = page.getByTestId('projects-create-key-input');
    this.nameInput = page.getByTestId('projects-create-name-input');
    this.submitButton = page.getByTestId('projects-create-submit');
    this.currentProject = page.getByTestId('topbar-project-button');
  }

  row(key: string): Locator {
    return this.page.getByTestId(`projects-table-row-${key.toLowerCase()}`);
  }

  async goto() {
    await this.page.goto('/projetos');
    await expect(this.root).toBeVisible();
  }

  /** Cria o projeto pela interface. O app já o deixa como projeto atual ao terminar. */
  async create(project: ProjectData) {
    await this.goto();
    await this.createButton.click();
    await this.keyInput.fill(project.key);
    await this.nameInput.fill(project.name);
    await this.submitButton.click();
    await expect(this.currentProject).toContainText(project.key);
  }
}
