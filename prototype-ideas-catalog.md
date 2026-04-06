# Interpretive Interfaces: A Swatch Book for LLM Internals

**A design research catalog for Spring 2026**
Gabrielle + undergrad research team, University of Washington

---

## Framing

This catalog proposes 15 small, buildable prototypes that bring the traditions of marginalia, glosses, commonplace books, and other humanistic textual practices to the problem of exposing and interacting with the intermediate layers of large language models. Each prototype is a "swatch" — a contained exploration of one combination of *historical form* × *model internal* × *interaction mode*. Together they constitute a design research contribution: not a product, but a systematic exploration of a design space.

The organizing conviction, after Johanna Drucker, is that visualizations of model internals should not pretend to be transparent windows onto objective data. They are *interpretive displays* — they shape what we notice, what we value, and how we reason about these systems. The historical forms we draw on (marginalia, glosses, florilegia, palimpsests) are themselves interpretive technologies that evolved over centuries for exactly this purpose: making complex texts navigable, debatable, personal.

### How to read this catalog

Each swatch is described with five fields:

- **Historical form**: the manuscript/book tradition it draws on
- **Model internal**: which intermediate representation it exposes
- **Interaction sketch**: what the user does
- **Visual character**: the aesthetic register — what it looks and feels like
- **Build notes**: feasibility for a mixed design + code team in 1–2 weeks

The swatches are grouped into five families.

---

## Family 1: Marginalia (annotations alongside a primary text)

### 1. Attention Marginalia

**Historical form**: Medieval marginal annotations — the pointing hands (manicules), bracket marks, and connecting lines that readers drew in margins to mark relationships within a text.

**Model internal**: Cross-attention and self-attention weights across heads and layers.

**Interaction sketch**: The user types or pastes a prompt. The model generates a response displayed as the "main text" in the center column. In the wide margins, hand-drawn-style manicules and connecting arcs show which input tokens each generated token attended to most strongly. Clicking a generated word fans out its attention distribution across all heads, rendered as a cluster of pointing hands of varying sizes. A layer slider lets you peel through the stack — early layers show local/syntactic attention, later layers show long-range semantic connections.

**Visual character**: Warm parchment background. The main text is set in a humanist serif. The marginal annotations use a rough, hand-drawn line quality (achieved via SVG filters or a hand-drawn rendering library like Rough.js). The overall feeling should be of a well-used medieval study text — dense with annotation but navigable.

**Build notes**: Frontend-heavy (HTML/CSS/JS + Rough.js). Attention data can come from a small model via Hugging Face Transformers in a Python backend, or from pre-computed JSON for a purely static prototype. Good first prototype for the team.

---

### 2. Entropy Weathering

**Historical form**: The way medieval manuscripts show wear — margins rubbed thin by many hands, ink fading where fingers rested, pages buckling from humidity. The physical text carries a record of how it was encountered.

**Model internal**: Per-token entropy (uncertainty) of the next-token probability distribution.

**Interaction sketch**: Generated text appears on a manuscript page. But the text itself is *physically weathered* in proportion to model uncertainty. High-confidence tokens are crisp, dark, well-inked. High-entropy tokens appear faded, smudged, or partially eroded — as though the model's hesitation has literally worn the text thin. Hovering over a weathered word reveals a cluster of alternative tokens the model considered, arranged like marginalia in different scribal hands.

**Visual character**: The key aesthetic move is treating uncertainty as *material degradation* rather than as a color scale or bar chart. Use CSS filters (blur, opacity), SVG displacement maps, or canvas-based distortion. The overall page should feel like a fragile manuscript where the unstable parts of the model's output are visibly fragile.

**Build notes**: Mostly frontend. Entropy values can be pre-computed or fetched from a lightweight API. The visual challenge is making the weathering look beautiful rather than broken — this is a good design-focused swatch.

---

### 3. Scribal Hands

**Historical form**: The codicological observation that many medieval manuscripts were written by multiple scribes, each with a distinct hand. Scholars learn to identify where one scribe's work ends and another begins.

**Model internal**: Which attention heads or SAE features are most active for each token.

**Interaction sketch**: The generated text is rendered in visually distinct "hands" — when different clusters of attention heads dominate, the typographic style shifts. One passage might appear in a round, confident uncial; another in a spiky, uncertain gothic. The user can click to see which "scribe" (which head cluster) wrote each passage. A sidebar catalogs the scribes with their characteristic features.

**Visual character**: Multiple variable fonts or webfonts, with smooth transitions between them. The metaphor is legible even before the user understands the underlying mechanics — they see that the text has *different authors* inside the model, and can begin to characterize them.

**Build notes**: Requires some clustering of attention head activations (a small Python script). The frontend uses variable fonts or font-switching with CSS transitions. Medium difficulty.

---

## Family 2: Glosses (explanatory annotation systems)

### 4. Interlinear Feature Glosses

**Historical form**: Interlinear glosses — the word-by-word annotations that medieval scholars wrote between the lines of a text, typically translating or explaining individual words. The Lindisfarne Gospels are a famous example: Latin text with Old English glosses squeezed between the lines.

**Model internal**: Sparse autoencoder (SAE) features — the interpretable directions extracted from activation space.

**Interaction sketch**: The main text is displayed with generous line spacing. Between each line, in a smaller, lighter typeface, the most active SAE features for each token are named. "King" might have interlinear glosses reading *royalty · male · authority · proper-noun*. The user can tap a feature name to highlight every token in the text that activates that feature, creating a kind of cross-referencing index.

**Visual character**: Clean, scholarly, dense. Inspired by critical editions with apparatus. The interlinear glosses should feel like a different voice — lighter weight, italic, slightly colored — creating a visual duet between the model's output and its internal feature vocabulary.

**Build notes**: Requires access to SAE feature activations (e.g., from Anthropic's published SAE dictionaries or an open-source SAE trained on a smaller model). The frontend is a careful typography exercise. Good swatch for a design-focused student.

---

### 5. Catena (Chain Commentary)

**Historical form**: The *catena* — a form of biblical commentary where multiple authorities' interpretations are chained together in the margins, each attributed. You might see Augustine, Chrysostom, and Jerome all commenting on the same verse.

**Model internal**: Layer-by-layer evolution of a token's representation.

**Interaction sketch**: Select a word in the generated text. In the margin, a vertical chain of commentaries appears — one for each layer of the model. Each "commentator" (layer) offers its interpretation: what the token's nearest neighbors are in that layer's representation space, how its feature activations differ from the previous layer. Early layers might say *"this is a common English word, noun-like."* Later layers might say *"this refers to the specific entity mentioned in token 3, and carries emotional valence."* The chain reads as a progressive deepening of interpretation.

**Visual character**: Vertical chain with each layer's commentary in a bordered block, connected by a decorative chain motif. Different layers could be color-coded (cool → warm as you go deeper). The chain should feel like an unfolding argument, not a data dump.

**Build notes**: Requires extracting per-layer representations and computing nearest neighbors or feature activations at each layer. Medium backend complexity. The frontend is a scrollable chain layout — straightforward.

---

### 6. Glossa Ordinaria (Standard Apparatus)

**Historical form**: The *Glossa Ordinaria* — the standard medieval commentary that surrounded biblical text on all four sides: interlinear glosses above and below, marginal commentary left and right. Every inch of margin was used.

**Model internal**: Multiple internals simultaneously — attention in one margin, features in another, entropy interlinear, probabilities in the footer.

**Interaction sketch**: This is the "maximalist" swatch. A single page displays the generated text surrounded on all sides by different model internals, each in its traditional position. The user doesn't interact much — this is a *contemplative* display, meant to be studied. But they can toggle each gloss layer on and off, building up from bare text to fully glossed.

**Visual character**: Dense, overwhelming, beautiful. The goal is to create the experience of looking at a page of the Glossa Ordinaria and feeling that same vertigo of *how much interpretation surrounds a simple text*. This is the swatch that most directly argues the thesis of the project.

**Build notes**: This is an integration swatch — it reuses components from other prototypes. Best saved for later in the quarter when individual components exist.

---

## Family 3: Commonplace Books (curating and reorganizing excerpts)

### 7. Feature Commonplace

**Historical form**: The Renaissance commonplace book — a personal notebook where readers collected notable passages organized under thematic headings (*loci communes*). Not a diary, but a curated anthology of other texts, reorganized by the reader's own categories.

**Model internal**: SAE features as organizing categories; token activations as "passages" to collect.

**Interaction sketch**: As the user has multiple conversations with a model, a commonplace book accumulates in the background. It automatically files passages under the SAE features they most strongly activate. The user opens their commonplace book and finds entries organized under headings like *"Spatial Reasoning," "Emotional Valence: Grief," "Code Logic: Recursion."* They can reorganize, annotate, and create their own headings — the book becomes a collaboration between the model's internal categories and the user's.

**Visual character**: A warm, journal-like interface. Handwritten-style headings. Passages displayed as collected excerpts with source annotations. The book should feel *personal* — accumulated over time, idiosyncratic.

**Build notes**: Requires persistence (localStorage or a simple backend). The SAE feature categorization can be pre-computed. The design challenge is making the commonplace book feel like a growing, living document. Good project for a student interested in personal knowledge management.

---

### 8. Probability Florilegia

**Historical form**: The *florilegium* — literally "a gathering of flowers." A medieval anthology of the most beautiful or important passages from various texts, arranged for easy reference and admiration.

**Model internal**: Moments of extreme probability behavior — very low entropy (high confidence), very high entropy (deep uncertainty), dramatic entropy shifts, surprising token choices.

**Interaction sketch**: As text is generated, the system automatically identifies "notable" moments in the probability landscape and collects them into a florilegium. Each entry shows the token in context, its probability distribution visualized as a small garden of flowers (common choices as tall flowers, rare choices as small buds), and a brief auto-generated annotation about why this moment is notable. The user curates their collection — they can star favorites, add their own notes, and share individual "flowers."

**Visual character**: Each probability distribution is rendered as a small botanical illustration — a tiny garden where the height, color, and bloom-state of flowers correspond to token probabilities. The overall page is a cabinet of curiosities displaying these micro-gardens.

**Build notes**: The botanical visualization is the creative challenge. Could use p5.js or SVG. The probability data is straightforward to extract. This is a beautiful swatch for a visually oriented student.

---

### 9. Activation Herbarium

**Historical form**: The botanical herbarium — a systematic collection of pressed, dried plant specimens mounted on sheets with taxonomic labels. A technology for organizing nature into knowable categories.

**Model internal**: Individual neuron or SAE feature activations, treated as "specimens" to be collected and classified.

**Interaction sketch**: Each SAE feature or neuron gets a "herbarium sheet" — a card displaying its characteristic activation pattern, the text examples that most strongly activate it, a visual "specimen" (a generative glyph whose shape is derived from the feature's activation profile), and a taxonomic label. The user browses the herbarium, proposes their own taxonomy (grouping features into families), and discovers relationships. Features that frequently co-activate are shown as symbiotic species.

**Visual character**: Clean, scientific-illustration aesthetic. Each card is a specimen sheet with a cream background, fine-line border, and careful typographic labels. The generative glyphs should have an organic, botanical quality — grown from the activation data, not arbitrary.

**Build notes**: The generative glyph creation is the most interesting challenge — mapping activation patterns to visual forms. Could use p5.js with deterministic seeds derived from feature vectors. Medium complexity across design and code.

---

## Family 4: Palimpsests (layered writing and erasure)

### 10. Layer Palimpsest

**Historical form**: The palimpsest — a manuscript page that has been scraped clean and rewritten, but where the original text still shows through faintly. A single page carrying multiple temporal layers.

**Model internal**: How a token's representation transforms across the model's layers — the "text" that gets progressively overwritten.

**Interaction sketch**: The display shows a single page of text. A scraping tool (styled as a medieval pen knife) lets the user scrape away the surface layer to reveal earlier layers beneath. The top layer is the final output. Scrape once and you see the representation from layer N-1 — the text is slightly different, showing what the model was "thinking" before the final layer refined it. Keep scraping to reach earlier and earlier layers. Each layer has its own visual character — the earliest layers are rough, raw, almost illegible; the final layer is polished.

**Visual character**: The scraping interaction should feel physical — use canvas-based eraser mechanics or CSS mask reveals. Each layer should have a distinct visual treatment: earlier layers more faded, rough-edged, possibly in a different script or alphabet to convey the foreignness of raw embeddings.

**Build notes**: Requires per-layer logits or decoded token predictions (running the unembedding matrix at each layer — a technique from the "logit lens"). The eraser/scraping interaction is a fun frontend challenge. Good swatch for students who like playful interactions.

---

### 11. Erasure Poetry

**Historical form**: Erasure poetry — a modern literary form where a poet takes an existing text and blacks out most of it, leaving only selected words to form a new poem. Also related to censorship and redaction in manuscript culture.

**Model internal**: Attention masks — which tokens the model attends to vs. ignores at different layers.

**Interaction sketch**: Display a full text passage. The user selects a layer and an attention head. The head's attention pattern is applied as an erasure mask — tokens the head doesn't attend to are blacked out, leaving only the attended-to tokens visible. Different heads produce radically different "poems" from the same text. The user can save and compare these erasure poems, and overlay multiple heads to see where they agree.

**Visual character**: Stark black redaction bars over white text. The revealed words float in a field of absence. When multiple heads are overlaid, the redaction bars become semi-transparent layers of gray and black, creating a visual palimpsest of attention.

**Build notes**: Technically simple — attention weights are thresholded and applied as CSS opacity. The design challenge is making the erasures feel meaningful and poetic rather than random. Good quick swatch.

---

## Family 5: Maps and Tables (spatial/organizational forms)

### 12. Mappa Mundi (World Map of Embeddings)

**Historical form**: The *mappa mundi* — a medieval world map that organized geographic and spiritual knowledge on a single surface, mixing physical places with biblical events, monstrous races, and theological concepts. Not a navigation tool but a cosmological diagram.

**Model internal**: Token embedding space, projected to 2D via UMAP or t-SNE.

**Interaction sketch**: The embedding space is displayed as a mappa mundi — a circular or T-O map with labeled regions. But instead of "Asia," "Europe," and "Africa," the regions are semantic territories: "Abstract Reasoning," "Emotional Language," "Proper Nouns," "Code." As the user types, their tokens appear as travelers moving through this landscape. They can zoom into regions to see finer-grained neighborhoods. The map is annotated with "here be dragons" warnings in regions of high-dimensional confusion.

**Visual character**: Medieval cartographic style — compass roses, sea monsters in the embedding void, decorative borders with wind-head figures. The map should be beautiful and disorienting in the way that medieval maps are — they reorganize space according to meaning rather than measurement.

**Build notes**: Requires pre-computed UMAP projections of a vocabulary's embeddings. The map rendering is a significant illustration/design task — consider pre-drawing the decorative elements and overlaying interactive data. Best for a student with illustration skills.

---

### 13. Concordance Table

**Historical form**: The biblical concordance — an alphabetical index of every word in a text with all its occurrences, allowing readers to find every context in which a word appears. A technology for exhaustive cross-referencing.

**Model internal**: Feature activation concordances — for a given SAE feature, every token in a corpus that activates it, displayed in context.

**Interaction sketch**: A searchable concordance where the entries are not words but *features*. Search for a feature (by name or by entering a word that activates it) and see every occurrence of that feature's activation across a corpus, displayed in the traditional concordance format: the activating token centered, with surrounding context on either side. The user can sort by activation strength, context type, or position. Comparing two features' concordances reveals their relationship.

**Visual character**: Austere, tabular, monospaced. The format of a printed concordance — dense columns of centered keywords with flanking context. The beauty is in the repetition and the patterns that emerge from seeing dozens of contexts for the same feature.

**Build notes**: Requires a pre-computed index of SAE feature activations across a corpus. The frontend is a search interface with formatted concordance output. Medium complexity, good for a code-focused student.

---

### 14. Bestiary of Attention Heads

**Historical form**: The medieval bestiary — an illustrated catalog of animals, real and imaginary, each with a moral lesson or symbolic meaning. A way of making sense of the natural world through narrative and illustration.

**Model internal**: Individual attention heads, characterized by their behavior patterns.

**Interaction sketch**: Each attention head gets a bestiary entry: a name, a generative illustration derived from its typical attention patterns, a description of its "habitat" (what types of text activate it), its "behavior" (what patterns it typically attends to — previous token? same syntactic role? named entities?), and a "moral" (what this tells us about how the model processes language). The user browses the bestiary like a catalog of strange creatures, each one a character.

**Visual character**: Richly illustrated in the style of a medieval bestiary — each head's illustration is generated from its attention patterns but rendered with organic, creature-like forms. Gold leaf accents. Decorative borders. Each entry should feel like encountering a strange new species.

**Build notes**: The generative illustrations are the key challenge — mapping attention patterns to creature-like forms. Could use p5.js with biological growth algorithms. The textual descriptions can be partially auto-generated using an LLM. High design ambition, medium code complexity.

---

### 15. Book of Hours (Temporal Attention)

**Historical form**: The Book of Hours — a medieval devotional book organized by the canonical hours of the day, each with its own prayers, psalms, and richly illuminated borders. A technology for structuring time.

**Model internal**: How attention patterns and feature activations change across the *sequence position* — the "time" of generation.

**Interaction sketch**: A long generated text is divided into temporal segments (like the hours of the day). Each segment gets its own illuminated page showing how the model's internal state differs at that point in generation. Early tokens (Matins) show the model establishing context — broad, diffuse attention. Middle tokens (Sext) show focused reasoning. Late tokens (Compline) show the model wrapping up, attention narrowing. The user moves through the "hours" of generation, each with its own visual character and border illumination derived from the model's state.

**Visual character**: The most art-directed swatch. Each "hour" should have a distinct color palette, border style, and illumination density derived from model internals at that point. The borders are generated from activation patterns — dense activations produce dense floral borders, sparse activations produce austere geometric frames.

**Build notes**: High design ambition. The border generation from activation data is the key technical-aesthetic challenge. Could be a capstone swatch for a student who wants to push the visual boundaries.

---

## Suggested Swatch Groupings for Students

Given three students with mixed design + code skills working over one quarter (~10 weeks):

**Student A (more design-oriented)**: Swatches 2, 8, 12 — Entropy Weathering, Probability Florilegia, Mappa Mundi. These emphasize visual design and generative illustration, with moderate frontend coding.

**Student B (more code-oriented)**: Swatches 5, 10, 13 — Catena, Layer Palimpsest, Concordance Table. These involve extracting and serving model internals, with clear frontend display requirements.

**Student C (balanced)**: Swatches 1, 4, 11 — Attention Marginalia, Interlinear Feature Glosses, Erasure Poetry. These balance information design with interactive frontend work.

**Shared capstone (weeks 8–10)**: Swatch 6 — Glossa Ordinaria. This integrates components from all three students' earlier work into a single, maximalist display.

---

## Technical Infrastructure Notes

**Data source options** (in order of increasing complexity):
1. Pre-computed JSON files from a small model (GPT-2 or Pythia) — good for static prototypes
2. A shared Python backend using Hugging Face Transformers with hooks to extract activations, attention, and logits per layer — good for interactive prototypes
3. Anthropic's published SAE dictionaries for Claude — good for the feature-based swatches (4, 7, 9, 13)

**Frontend stack suggestion**: Vanilla HTML/CSS/JS + Rough.js (hand-drawn rendering) + p5.js (generative visuals). Keep it simple. These are research prototypes, not production apps.

**Shared design language**: Agree on a common color palette, type scale, and page layout (the "manuscript page" template) in week 1. Individual swatches can diverge in visual character but should share enough DNA to feel like a coherent swatch book when collected.
