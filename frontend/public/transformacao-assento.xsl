<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    
    <!-- Configuração da saída para HTML estruturado -->
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>

    <!-- 1. Interceta a raiz do documento -->
    <xsl:template match="/">
        <div class="visualizador-diplomatico">
            <xsl:apply-templates select="div"/>
        </div>
    </xsl:template>

    <!-- 2. Estrutura o bloco do ano e a lista de registos -->
    <xsl:template match="div[@type='year']">
        <section class="ano-registro">
            <h2>Ano: <xsl:value-of select="head"/></h2>
            <div class="lista-assentos">
                <xsl:apply-templates select="list/entry"/>
            </div>
        </section>
    </xsl:template>

    <!-- 3. Formata cada assento (entry) num painel de leitura independente -->
    <xsl:template match="entry">
        <article class="assento-obito" id="registro-{@n}">
            <header class="cabecalho-assento">
                <h3>Assento Nº <xsl:value-of select="@n"/></h3>
                <!-- Extrai o nome do falecido diretamente para o cabeçalho para facilitar a leitura -->
                <p><strong>Falecido(a): </strong> 
                   <xsl:value-of select="persName[@type='deceased']/forename"/>
                   <xsl:text> </xsl:text>
                   <xsl:value-of select="persName[@type='deceased']/surname"/>
                </p>
            </header>

            <!-- 4. Renderiza a mancha de texto do documento com os seus fenómenos -->
            <div class="corpo-transcricao" style="line-height: 1.8; margin-top: 15px;">
                <xsl:apply-templates select="p"/>
            </div>
            
            <!-- Renderiza a assinatura -->
            <div class="assinatura-parocho">
                <xsl:apply-templates select="signed"/>
            </div>
        </article>
    </xsl:template>

    <!-- 5. Regras para os fenómenos de quebra de linha (Line Breaks) -->
    <xsl:template match="lb">
        <br class="quebra-linha-diplomatica"/>
    </xsl:template>

    <!-- 6. Tratamento de entidades nomeadas e termos anotados para interatividade -->
    <!-- Template para as várias entidades -->
    <xsl:template match="death | placeName | sacraments | state | occupation | age | birthPlace | residence | relation | funeral">
        <span class="termo-anotado {local-name()} transition-colors duration-300 rounded" 
              title="Categoria: {local-name()}">
            <xsl:if test="@when"><xsl:attribute name="data-data-cronologica"><xsl:value-of select="@when"/></xsl:attribute></xsl:if>
            <xsl:if test="@type"><xsl:attribute name="data-tipo"><xsl:value-of select="@type"/></xsl:attribute></xsl:if>
            <xsl:apply-templates/>
        </span>
    </xsl:template>

    <!-- Template para Nomes de Pessoas -->
    <xsl:template match="persName">
        <span class="termo-anotado persName transition-colors duration-300 rounded" data-id="{@id}" data-funcao="{@type | @role | ../@type}">
            <xsl:apply-templates/>
        </span>
    </xsl:template>

    <!-- 8. Tratamento de referências cruzadas e ponteiros -->
    <xsl:template match="ptr">
        <a href="#{@target}" class="referencia-cruzada anotacao" data-alvo="{@target}">
            <xsl:apply-templates/>
        </a>
    </xsl:template>

    <!-- 9. Formatação da assinatura -->
    <xsl:template match="signed">
        <div class="bloco-assinatura" style="text-align: right; margin-top: 1rem;">
            <!-- Renderiza o atributo rend='italic' de forma prática -->
            <xsl:if test="@rend='italic'">
                <xsl:attribute name="style">text-align: right; margin-top: 1rem; font-style: italic;</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates/>
        </div>
    </xsl:template>

</xsl:stylesheet>
