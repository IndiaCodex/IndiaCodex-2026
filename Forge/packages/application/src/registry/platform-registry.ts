import type {
  CommandDefinition,
  GeneratorDefinition,
  HookEvent,
  HookHandler,
  HookPayloadMap,
  Logger,
  PortToken,
} from "@forge/plugin-api";
import { MissingPortBindingError } from "./missing-port-binding-error.js";

type AnyHookHandler = HookHandler<HookEvent>;

/**
 * The concrete hub every plugin — built-in or third-party — registers
 * against through the identical PluginContext API. Use cases resolve their
 * port dependencies from here; nothing in the platform imports a concrete
 * adapter directly.
 */
export class PlatformRegistry {
  private readonly portBindings = new Map<symbol, unknown>();
  private readonly hookHandlers = new Map<HookEvent, AnyHookHandler[]>();
  private readonly commands = new Map<string, CommandDefinition>();
  private readonly generators = new Map<string, GeneratorDefinition>();

  constructor(private readonly logger: Logger) {}

  bindPort<T>(port: PortToken<T>, implementation: T): void {
    this.portBindings.set(port.key, implementation);
    this.logger.debug(`Port bound: ${port.description}`);
  }

  hasPort<T>(port: PortToken<T>): boolean {
    return this.portBindings.has(port.key);
  }

  getPort<T>(port: PortToken<T>): T {
    if (!this.portBindings.has(port.key)) {
      throw new MissingPortBindingError(port.description);
    }
    return this.portBindings.get(port.key) as T;
  }

  onHook<E extends HookEvent>(event: E, handler: HookHandler<E>): void {
    const handlers = this.hookHandlers.get(event) ?? [];
    handlers.push(handler as AnyHookHandler);
    this.hookHandlers.set(event, handlers);
  }

  async fireHook<E extends HookEvent>(event: E, payload: HookPayloadMap[E]): Promise<void> {
    const handlers = this.hookHandlers.get(event) ?? [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }

  registerCommand(command: CommandDefinition): void {
    this.commands.set(command.name, command);
  }

  getCommands(): readonly CommandDefinition[] {
    return [...this.commands.values()];
  }

  registerGenerator(generator: GeneratorDefinition): void {
    this.generators.set(generator.name, generator);
  }

  getGenerators(): readonly GeneratorDefinition[] {
    return [...this.generators.values()];
  }
}
