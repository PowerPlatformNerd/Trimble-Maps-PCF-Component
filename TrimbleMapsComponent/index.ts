import { IInputs, IOutputs } from "./generated/ManifestTypes";

// Declare TrimbleMaps as a global object
declare var TrimbleMaps: any;

export class TrimbleMapsComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;

    // Variables to store inputs
    private apiKey: string | null = null;
    private stop1: string | null = null;
    private stop2: string | null = null;
    private stop3: string | null = null;

    constructor() { }

    // Initialize the control and load the external Trimble Maps SDK
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        // Create a div to contain the map
        this._container = document.createElement("div");
        this._container.setAttribute("id", "map");
        this._container.style.height = "398px";  // You can adjust the height here
        this._container.style.width = "100%";
        container.appendChild(this._container);

        // Load the Trimble Maps CSS
        this.loadCss("https://maps-sdk.trimblemaps.com/v3/trimblemaps-3.18.0.css");

        // Load the Trimble Maps JavaScript SDK and initialize the map
        this.loadJs("https://maps-sdk.trimblemaps.com/v3/trimblemaps-3.18.0.js")
            .then(() => {
                this.updateInputs(context);  // Update and initialize map with inputs
            })
            .catch(error => {
                console.error("Error loading Trimble Maps SDK", error);
            });
    }

    // Helper function to load external CSS
    private loadCss(url: string): void {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    // Helper function to load external JavaScript
    private loadJs(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // Function to parse inputs and update the map
    private updateInputs(context: ComponentFramework.Context<IInputs>): void {
        // Parse API key and stop inputs
        this.apiKey = context.parameters.apiKey.raw;
        this.stop1 = context.parameters.stop1.raw;
        this.stop2 = context.parameters.stop2.raw;
        this.stop3 = context.parameters.stop3.raw;

        // Initialize the map with dynamic inputs
        this.initializeMap();
    }

    // Initialize the Trimble Map with dynamic API key and stops
    private initializeMap(): void {
        if (!this.apiKey) {
            console.error("API key is required to initialize the Trimble map.");
            return;
        }

        // Ensure TrimbleMaps is loaded before using it - Added
        if (typeof TrimbleMaps === 'undefined') {
            console.error("Trimble Maps SDK is not loaded. Cannot initialize map.");
            return;
        }

        TrimbleMaps.APIKey = this.apiKey;  // Use the dynamic API key

        const map = new TrimbleMaps.Map({
            container: 'map',
            style: TrimbleMaps.Common.Style.TRANSPORTATION,
            center: new TrimbleMaps.LngLat(-95.737030, 41.733405), //-74.566234, 40.49944  
            zoom: 6
        });

        // Build dynamic stops array
        const stops= [];
        if (this.stop1) {
            const [lng1, lat1] = this.stop1.split(',').map(Number);
            stops.push(new TrimbleMaps.LngLat(lng1, lat1));
        }
        if (this.stop2) {
            const [lng2, lat2] = this.stop2.split(',').map(Number);
            stops.push(new TrimbleMaps.LngLat(lng2, lat2));
        }
        if (this.stop3) {
            const [lng3, lat3] = this.stop3.split(',').map(Number);
            stops.push(new TrimbleMaps.LngLat(lng3, lat3));
        }

       // Create route only if there are at least two valid stops
        if (stops.length > 1) {
            const myRoute = new TrimbleMaps.Route({
                routeId: "myRoute",
                stops: stops
            });

            map.on('load', () => {
                myRoute.addTo(map);
                map.addControl(new TrimbleMaps.NavigationControl());
            });
        } else {
            console.error("At least two stops are required to create a route.");
        }
    }

    // Handle view updates (e.g., changes in inputs)
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.updateInputs(context);  // Reinitialize map if inputs change
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup when the control is destroyed
    }
}
